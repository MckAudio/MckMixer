#include "MckMixer.h"

static int process(jack_nframes_t nframes, void *arg)
{
    ((mck::Mixer *)arg)->ProcessAudio(nframes);
    return 0;
}

mck::Mixer::Mixer()
    : m_gui(nullptr),
      m_isInitialized(false),
      m_bufferSize(0),
      m_sampleRate(0),
      m_activeConfig(0),
      m_newConfig(1),
      m_nInputChans(),
      m_meterCoeff(1.0)
{
    m_nInputChans[0] = 0;
    m_nInputChans[1] = 0;
    m_updateValues = false;
    m_updateCount = false;
    m_updateReady = false;
    m_isProcessing = true;
    m_phase = PROC_FADE_IN;
    m_dataUpdate = false;
}

bool mck::Mixer::Init(std::string path)
{
    if (m_isInitialized)
    {
        std::fprintf(stderr, "MixerModule is already initialize\n");
        return false;
    }

    // Malloc Audio Inputs
    /*
    m_audioIn = (jack_port_t **)malloc(MCK_MIXER_MAX_INPUTS * sizeof(jack_port_t *));
    memset(m_audioIn, 0, MCK_MIXER_MAX_INPUTS * sizeof(jack_port_t *));
    m_bufferIn = (jack_default_audio_sample_t **)malloc(MCK_MIXER_MAX_INPUTS * sizeof(jack_nframes_t *));
    memset(m_bufferIn, 0, MCK_MIXER_MAX_INPUTS * sizeof(jack_nframes_t *));
    */

    // Open JACK server
    m_client = jack_client_open("MckMixer", JackNoStartServer, NULL);

    if (m_client == nullptr)
    {
        std::fprintf(stderr, "JACK server is not running.\n");
        return false;
    }

    jack_set_process_callback(m_client, process, (void *)this);

    // Set Output Channels
    m_audioOut[0] = jack_port_register(m_client, "audio_out_l", JACK_DEFAULT_AUDIO_TYPE, JackPortIsOutput, 0);
    m_audioOut[1] = jack_port_register(m_client, "audio_out_r", JACK_DEFAULT_AUDIO_TYPE, JackPortIsOutput, 0);

    // Set MIDI Channels
    m_midiClkIn = jack_port_register(m_client, "midi_clk_in", JACK_DEFAULT_MIDI_TYPE, JackPortIsInput, 0);
    m_midiClkOut = jack_port_register(m_client, "midi_clk_out", JACK_DEFAULT_MIDI_TYPE, JackPortIsOutput, 0);
    m_midiCtrlIn = jack_port_register(m_client, "midi_ctrl_in", JACK_DEFAULT_MIDI_TYPE, JackPortIsInput, 0);
    m_midiCtrlOut = jack_port_register(m_client, "midi_ctrl_out", JACK_DEFAULT_MIDI_TYPE, JackPortIsOutput, 0);

    m_bufferSize = jack_get_buffer_size(m_client);
    m_sampleRate = jack_get_sample_rate(m_client);

    // Init Input DSP structures
    unsigned memSize = m_bufferSize * sizeof(jack_default_audio_sample_t);
    m_inputDsp = (InputDsp *)malloc(MCK_MIXER_MAX_INPUTS * sizeof(InputDsp));
    memset(m_inputDsp, 0, MCK_MIXER_MAX_INPUTS * sizeof(InputDsp));

    // Init DSP stuff
    m_interpolLin = (double *)malloc(m_bufferSize * sizeof(double));
    m_interpolSqrt = (double *)malloc(m_bufferSize * sizeof(double));
    for (unsigned i = 0; i < m_bufferSize; i++)
    {
        m_interpolLin[i] = (double)i / (double)(m_bufferSize - 1);
        m_interpolSqrt[i] = std::sqrt(m_interpolLin[i]);
    }

    m_reverbBuffer[0] = (jack_default_audio_sample_t *)malloc(m_bufferSize * sizeof(jack_default_audio_sample_t));
    m_reverbBuffer[1] = (jack_default_audio_sample_t *)malloc(m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_reverbBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_reverbBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    m_delayBuffer[0] = (jack_default_audio_sample_t *)malloc(m_bufferSize * sizeof(jack_default_audio_sample_t));
    m_delayBuffer[1] = (jack_default_audio_sample_t *)malloc(m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_delayBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_delayBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    // Metering
    double tBuf = (double)m_bufferSize / (double)m_sampleRate;
    m_meterCoeff = tBuf / 0.05; // 150ms METER integration time

    // Reverb
    m_reverb = (fv3::revbase_f **)malloc(REV_LENGTH * sizeof(fv3::revbase_f *));
    m_reverb[REV_STREV] = new fv3::strev_f();
    m_reverb[REV_PROG] = new fv3::progenitor2_f();
    m_reverb[REV_ZREV] = new fv3::zrev2_f();
    m_reverb[REV_NREV] = new fv3::nrevb_f();
    for (unsigned i = 0; i < REV_LENGTH; i++)
    {
        m_reverb[i]->setSampleRate(m_sampleRate);
        m_reverb[i]->setwet(0.0);
        m_reverb[i]->setdry(-200.0);
    }

    // Delay
    m_delay.Init(m_sampleRate, m_bufferSize);

    // Recorder
    m_recorder.Init(m_sampleRate, m_bufferSize);

    // Metronome
    m_metro.Init(m_sampleRate, m_bufferSize);

    // Transport
    m_trans.Init(m_sampleRate, m_bufferSize, 120.0);
    m_control.SetTransport(&m_trans);

    // Looper
    for (unsigned i = 0; i < MCK_MIXER_MAX_INPUTS; i++)
    {
        m_inputDsp[i].looper.Init(m_sampleRate, m_bufferSize, &m_trans);
        m_control.AddLooper(&m_inputDsp[i].looper);
    }

    // Read Configuration
    mck::Config newConfig;
    bool createFile = LoadConfig(newConfig, path) == false;

    if (createFile)
    {
        SaveConfig(newConfig, path);
    }

    m_path = fs::path(path);

    if (jack_activate(m_client))
    {
        std::fprintf(stderr, "Unable to activate JACK client!\n");
        return false;
    }

    SetConfig(newConfig);

    m_isInitialized = true;
    return true;
}

void mck::Mixer::Close()
{
    if (m_isInitialized == false)
    {
        return;
    }

    if (m_client != nullptr)
    {
        m_phase = PROC_CLOSING;
        std::unique_lock<std::mutex> lck(m_updateMutex);
        while (true)
        {
            if (m_phase.load() == PROC_CLOSED)
            {
                break;
            }
            m_updateCond.wait(lck);
        }

        // Save MIDI Connections
        std::vector<std::string> cons;
        mck::GetConnections(m_client, m_midiClkIn, cons);
        m_config[m_activeConfig].clockSource = cons;
        cons.clear();
        mck::GetConnections(m_client, m_midiClkOut, cons);
        m_config[m_activeConfig].clockTarget = cons;
        cons.clear();
        mck::GetConnections(m_client, m_midiCtrlIn, cons);
        m_config[m_activeConfig].controlSource = cons;
        cons.clear();
        mck::GetConnections(m_client, m_midiCtrlOut, cons);
        m_config[m_activeConfig].controlTarget = cons;

        // Save Output Connections
        cons.clear();
        mck::GetConnections(m_client, m_audioOut[0], cons);
        m_config[m_activeConfig].targetLeft = cons;

        mck::GetConnections(m_client, m_audioOut[1], cons);
        m_config[m_activeConfig].targetRight = cons;

        // Save Input Connections
        for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
        {
            mck::GetConnections(m_client, m_inputDsp[i].port[0], cons);
            if (cons.size() > 0)
            {
                m_config[m_activeConfig].channels[i].sourceLeft = cons[0];
            }
            else
            {
                m_config[m_activeConfig].channels[i].sourceLeft = "";
            }
            if (m_config[m_activeConfig].channels[i].isStereo)
            {
                mck::GetConnections(m_client, m_inputDsp[i].port[1], cons);
                if (cons.size() > 0)
                {
                    m_config[m_activeConfig].channels[i].sourceRight = cons[0];
                }
                else
                {
                    m_config[m_activeConfig].channels[i].sourceRight = "";
                }
            }
        }
        try
        {
            jack_client_close(m_client);
        }
        catch (std::exception &e)
        {
            std::fprintf(stderr, "Failed to close JACK client: %s\n", e.what());
        }
    }

    SaveConfig(m_config[m_activeConfig], m_path.string());

    free(m_inputDsp);

    free(m_interpolLin);
    free(m_interpolSqrt);

    free(m_reverbBuffer[0]);
    free(m_reverbBuffer[1]);
    free(m_delayBuffer[0]);
    free(m_delayBuffer[1]);

    for (unsigned i = 0; i < REV_LENGTH; i++)
    {
        delete m_reverb[i];
    }
    free(m_reverb);

    m_isInitialized = false;
}

bool mck::Mixer::SetConfig(mck::Config &config)
{
    if (m_phase.load() == PROC_UPDATING)
    {
        std::fprintf(stderr, "MckMixer is updating...\n");
        return false;
    }

    unsigned nChans = 0;
    m_newConfig = 1 - m_activeConfig;

    // Check Channel Controls
    if (config.channelControls.controls.size() != CCT_LENGTH)
    {
        config.channelControls.controls.resize(CCT_LENGTH);
    }
    if (config.channelControls.names.size() != CCT_LENGTH)
    {
        config.channelControls.names.resize(CCT_LENGTH);
        config.channelControls.names[CCT_PREV_CHANNEL] = "Previous Channel";
        config.channelControls.names[CCT_NEXT_CHANNEL] = "Next Channel";
        config.channelControls.names[CCT_TOGGLE_MASTER] = "Toggle Master";
        config.channelControls.names[CCT_PREV_GAIN] = "Previous Gain Ctrl";
        config.channelControls.names[CCT_NEXT_GAIN] = "Next Gain Ctrl";
        config.channelControls.names[CCT_GAIN_CTRL] = "Gain Ctrl";
        config.channelControls.names[CCT_LOOP_RECORD] = "Loop Record";
        config.channelControls.names[CCT_LOOP_START] = "Loop Start";
        config.channelControls.names[CCT_LOOP_STOP] = "Loop Stop";
    }

    // Convert Gain dB to lin
    config.gainLin = mck::DbToLin(config.gain);
    config.reverb.gainLin = mck::DbToLin(config.reverb.gain);
    config.delay.gainLin = mck::DbToLin(config.delay.gain);

    bool soloSet = false;
    for (unsigned i = 0; i < config.channels.size(); i++)
    {
        soloSet |= config.channels[i].solo;
    }

    for (unsigned i = 0; i < config.channels.size(); i++)
    {
        if (config.channels[i].isStereo)
        {
            nChans += 2;
        }
        else
        {
            nChans += 1;
        }

        config.channels[i].pan = std::min(100.0, std::max(0.0, config.channels[i].pan));

        config.channels[i].inputGainLin = mck::DbToLin(config.channels[i].inputGain);
        config.channels[i].loopGainLin = mck::DbToLin(config.channels[i].loopGain);
        config.channels[i].gainLin = mck::DbToLin(config.channels[i].gain);
        if (config.channels[i].mute || (soloSet && !config.channels[i].solo))
        {
            config.channels[i].gainLin = 0.0;
        }
        config.channels[i].sendReverbLin = mck::DbToLin(config.channels[i].sendReverb);
        config.channels[i].sendDelayLin = mck::DbToLin(config.channels[i].sendDelay);
    }
    config.reverb.type = std::min(config.reverb.type, (unsigned)(REV_LENGTH - 1));
    config.channelCount = config.channels.size();

    // Connect MIDI Channels
    if (mck::NewConnections(m_client, m_midiClkIn, config.clockSource))
    {
        mck::SetConnections(m_client, m_midiClkIn, config.clockSource, true);
    }
    if (mck::NewConnections(m_client, m_midiClkOut, config.clockTarget))
    {
        mck::SetConnections(m_client, m_midiClkOut, config.clockTarget, false);
    }
    if (mck::NewConnections(m_client, m_midiCtrlIn, config.controlSource))
    {
        mck::SetConnections(m_client, m_midiCtrlIn, config.controlSource, true);
    }
    if (mck::NewConnections(m_client, m_midiCtrlOut, config.controlTarget))
    {
        mck::SetConnections(m_client, m_midiCtrlOut, config.controlTarget, false);
    }

    // Connect Output Channels
    if (mck::NewConnections(m_client, m_audioOut[0], config.targetLeft))
    {
        mck::SetConnections(m_client, m_audioOut[0], config.targetLeft, false);
    }
    if (mck::NewConnections(m_client, m_audioOut[1], config.targetRight))
    {
        mck::SetConnections(m_client, m_audioOut[1], config.targetRight, false);
    }

    m_config[m_newConfig] = config;
    m_nInputChans[m_newConfig] = nChans;

    std::string name = "";

    if (nChans != m_nInputChans[m_activeConfig] || config.channelCount != m_config[m_activeConfig].channelCount)
    {
        mck::Config &curConfig = m_config[m_activeConfig];

        // Signal audio process to fade out and wait for new values
        m_phase = PROC_FADE_OUT;
        char phase = PROC_FADE_OUT;
        std::unique_lock<std::mutex> lck(m_updateMutex);
        while (true)
        {
            phase = m_phase.load();
            if (phase == PROC_CLOSED)
            {
                return false;
            }
            if (phase == PROC_BYPASS)
            {
                break;
            }
            m_updateCond.wait(lck);
        }
        int ret = 0;
        //ret = jack_deactivate(m_client);

        // Change exisiting channels
        for (unsigned i = 0; i < std::min(config.channelCount, curConfig.channelCount); i++)
        {
            if (config.channels[i].isStereo != curConfig.channels[i].isStereo)
            {
                if (config.channels[i].isStereo)
                {
                    name = "audio_in_" + std::to_string(i + 1) + "_l";
                    jack_port_rename(m_client, m_inputDsp[i].port[0], name.c_str());
                    name = "audio_in_" + std::to_string(i + 1) + "_r";
                    m_inputDsp[i].port[1] = jack_port_register(m_client, name.c_str(), JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
                    m_inputDsp[i].isStereo = true;
                }
                else
                {
                    name = "audio_in_" + std::to_string(i + 1) + "_m";
                    jack_port_rename(m_client, m_inputDsp[i].port[0], name.c_str());
                    jack_port_unregister(m_client, m_inputDsp[i].port[1]);
                    m_inputDsp[i].isStereo = false;
                }
            }
        }
        // Delete existing channels
        for (unsigned i = config.channelCount; i < curConfig.channelCount; i++)
        {
            jack_port_unregister(m_client, m_inputDsp[i].port[0]);
            if (m_inputDsp[i].isStereo)
            {
                jack_port_unregister(m_client, m_inputDsp[i].port[1]);
            }
        }

        // Add new channels
        for (unsigned i = curConfig.channelCount; i < config.channelCount; i++)
        {
            if (config.channels[i].isStereo)
            {
                name = "audio_in_" + std::to_string(i + 1) + "_l";
                m_inputDsp[i].port[0] = jack_port_register(m_client, name.c_str(), JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
                name = "audio_in_" + std::to_string(i + 1) + "_r";
                m_inputDsp[i].port[1] = jack_port_register(m_client, name.c_str(), JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
                m_inputDsp[i].isStereo = true;
            }
            else
            {
                name = "audio_in_" + std::to_string(i + 1) + "_m";
                m_inputDsp[i].port[0] = jack_port_register(m_client, name.c_str(), JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
                m_inputDsp[i].isStereo = false;
            }
        }

        // Check Connections
        std::vector<std::string> cons;
        cons.push_back("");
        for (unsigned i = 0; i < config.channelCount; i++)
        {
            mck::SetConnection(m_client, m_inputDsp[i].port[0], config.channels[i].sourceLeft, true);
            if (config.channels[i].isStereo)
            {
                mck::SetConnection(m_client, m_inputDsp[i].port[1], config.channels[i].sourceRight, true);
            }
        }

        m_phase = PROC_FADE_IN;

        //jack_activate(m_client);

        SaveConfig(config, m_path.string());

        return true;
    }
    else
    {
        m_phase = PROC_UPDATING;

        SaveConfig(config, m_path.string());

        return true;
    }
}

bool mck::Mixer::GetConfig(mck::Config &config)
{
    config = m_config[m_activeConfig];
    return true;
}

bool mck::Mixer::AddChannel(bool isStereo, mck::Config &outConfig)
{
    if (m_nInputChans[m_activeConfig] == 32 || (m_nInputChans[m_activeConfig] == 31 && isStereo))
    {
        return false;
    }

    mck::Channel chan;

    GetConfig(outConfig);

    chan.name = "Channel " + std::to_string(outConfig.channels.size() + 1);
    chan.isStereo = isStereo;

    outConfig.channels.push_back(chan);

    bool ret = SetConfig(outConfig);

    if (ret == false)
    {
        GetConfig(outConfig);
    }

    return ret;
}

bool mck::Mixer::RemoveChannel(unsigned idx, mck::Config &outConfig)
{
    GetConfig(outConfig);

    if (idx >= outConfig.channelCount)
    {
        return false;
    }

    outConfig.channels.erase(outConfig.channels.begin() + idx);

    bool ret = SetConfig(outConfig);
    if (ret == false)
    {
        GetConfig(outConfig);
    }

    return ret;
}

bool mck::Mixer::ApplyCommand(mck::ConnectionCommand cmd, mck::Config &outConfig)
{
    std::vector<std::string> cons;
    GetConfig(outConfig);

    if (cmd.isInput)
    {
        if (cmd.idx >= outConfig.channelCount)
        {
            return false;
        }

        if (outConfig.channels[cmd.idx].isStereo)
        {
            if (cmd.subIdx > 1)
            {
                return false;
            }
        }
        else if (cmd.subIdx > 0)
        {
            return false;
        }

        if (cmd.command == "connect")
        {
            cons.push_back(cmd.target);

            if (mck::NewConnections(m_client, m_inputDsp[cmd.idx].port[cmd.subIdx], cons))
            {
                if (mck::SetConnections(m_client, m_inputDsp[cmd.idx].port[cmd.subIdx], cons, true) == false)
                {
                    return false;
                }
                if (cmd.subIdx == 0)
                {
                    outConfig.channels[cmd.idx].sourceLeft = cons[0];
                }
                else
                {
                    outConfig.channels[cmd.idx].sourceRight = cons[0];
                }
                return SetConfig(outConfig);
            }
        }
        else if (cmd.command == "disconnect")
        {
            if (mck::SetConnections(m_client, m_inputDsp[cmd.idx].port[cmd.subIdx], cons, true) == false)
            {
                return false;
            }
            if (cmd.subIdx == 0)
            {
                outConfig.channels[cmd.idx].sourceLeft = "";
            }
            else
            {
                outConfig.channels[cmd.idx].sourceRight = "";
            }
            return SetConfig(outConfig);
        }
    }
    else
    {
        if (cmd.subIdx > 1)
        {
            return false;
        }

        if (cmd.command == "connect")
        {
            cons.push_back(cmd.target);

            if (mck::NewConnections(m_client, m_audioOut[cmd.subIdx], cons))
            {
                if (mck::SetConnections(m_client, m_audioOut[cmd.subIdx], cons, false) == false)
                {
                    return false;
                }
                if (cmd.subIdx == 0)
                {
                    outConfig.targetLeft = cons;
                }
                else
                {
                    outConfig.targetRight = cons;
                }
                return SetConfig(outConfig);
            }
        }
        else if (cmd.command == "disconnect")
        {
            if (mck::SetConnections(m_client, m_audioOut[cmd.subIdx], cons, false) == false)
            {
                return false;
            }
            if (cmd.subIdx == 0)
            {
                outConfig.targetLeft = cons;
            }
            else
            {
                outConfig.targetRight = cons;
            }
            return SetConfig(outConfig);
        }
    }

    return true;
}

bool mck::Mixer::ApplyCommand(mck::LoopCommand &cmd)
{
    if (cmd.chanIdx >= m_config[m_activeConfig].channelCount)
    {
        return false;
    }
    return m_inputDsp[cmd.chanIdx].looper.ApplyCommand(cmd, m_config[m_activeConfig].channels[cmd.chanIdx].isStereo);
}

bool mck::Mixer::ApplyCommand(mck::TransportCommand &cmd)
{
    return m_trans.ApplyCommand(cmd);
}

bool mck::Mixer::ApplyCommand(mck::ChannelControlCommand &cmd)
{
    mck::Config config;
    mck::Channel chan;

    GetConfig(config);

    if (cmd.cmd >= CCC_LENGTH || cmd.type >= CCT_LENGTH)
    {
        return false;
    }

    switch (cmd.cmd)
    {
    case CCC_LEARN:
        config.channelControls.learn = true;
        config.channelControls.controls[cmd.type].learn = true;
        break;
    case CCC_STOP:
        config.channelControls.learn = false;
        config.channelControls.controls[cmd.type].learn = false;
        break;
    case CCC_CLEAR:
        config.channelControls.controls[cmd.type] = MidiControl();
        break;
    default:
        return true;
    }

    bool ret = SetConfig(config);

    if (ret == false)
    {
        GetConfig(config);
    }

    return ret;
}

void mck::Mixer::ProcessAudio(jack_nframes_t nframes)
{
    char phase = m_phase.load();

    if (phase == PROC_CLOSED)
    {
        return;
    }

    // Output Channels
    m_bufferOut[0] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_audioOut[0], nframes);
    m_bufferOut[1] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_audioOut[1], nframes);

    // Reset
    memset(m_bufferOut[0], 0, nframes * sizeof(jack_default_audio_sample_t));
    memset(m_bufferOut[1], 0, nframes * sizeof(jack_default_audio_sample_t));

    if (phase == PROC_BYPASS)
    {
        return;
    }

    // CONTROL
    bool updateConfig = false;
    ControlState ctrlState;
    if (phase == PROC_UPDATING)
    {
        updateConfig = true;
        //m_control.ProcessMidi(m_midiCtrlIn, m_midiCtrlOut, nframes, m_config[m_newConfig], updateConfig, ctrlState);
        // Channel Controls
        m_control.Process(m_midiCtrlIn, m_midiCtrlOut, nframes, m_config[m_newConfig], updateConfig);
    }
    else if (phase == PROC_NORMAL)
    {
        //m_control.ProcessMidi(m_midiCtrlIn, m_midiCtrlOut, nframes, m_config[m_newConfig], updateConfig, ctrlState);
        // Channel Controls
        m_control.Process(m_midiCtrlIn, m_midiCtrlOut, nframes, m_config[m_newConfig], updateConfig);
        if (updateConfig)
        {
            // Handle new values
            phase = PROC_UPDATING;
        }
    }
    // TRANSPORT
    TransportState transState;
    m_trans.Process(m_midiClkOut, nframes, transState);

    // MIDI
    void *clk_buf = jack_port_get_buffer(m_midiClkIn, nframes);

    jack_midi_event_t event;
    jack_nframes_t eventIdx = 0;
    jack_nframes_t eventCount = jack_midi_get_event_count(clk_buf);
    bool sysMsg = false;
    bool clkSet = false;
    bool print = false;

    for (unsigned i = 0; i < eventCount; i++)
    {
        jack_midi_event_get(&event, clk_buf, i);

        sysMsg = (event.buffer[0] & 0xf0) == 0xf0;

        if (sysMsg)
        {
            m_metro.ProcessSysEx(&event);
        }
    }
    m_metro.EndProcess();

    memset(m_reverbBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_reverbBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    memset(m_delayBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_delayBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    // Input Channels
    for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
    {
        m_inputDsp[i].buffer[0] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_inputDsp[i].port[0], nframes);
        m_inputDsp[i].meterLin[0] = (1.0 - m_meterCoeff) * m_inputDsp[i].meterLin[0] + m_meterCoeff * mck::CalcMeterLin((float *)m_inputDsp[i].buffer[0], nframes);
        m_inputDsp[i].meter[0] = mck::LinToDb(m_inputDsp[i].meterLin[0]);
        if (m_inputDsp[i].isStereo)
        {
            m_inputDsp[i].buffer[1] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_inputDsp[i].port[1], nframes);
            m_inputDsp[i].meterLin[1] = (1.0 - m_meterCoeff) * m_inputDsp[i].meterLin[1] + m_meterCoeff * mck::CalcMeterLin((float *)m_inputDsp[i].buffer[1], nframes);
            m_inputDsp[i].meter[1] = mck::LinToDb(m_inputDsp[i].meterLin[1]);
        }
    }

    // Apply Input Gain
    for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
    {
        if (m_inputDsp[i].isStereo)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] *= m_config[m_activeConfig].channels[i].inputGainLin;
                m_inputDsp[i].buffer[1][s] *= m_config[m_activeConfig].channels[i].inputGainLin;
            }
        }
        else
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] *= m_config[m_activeConfig].channels[i].inputGainLin;
            }
        }
    }

    // Looper
    for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
    {
        if (m_inputDsp[i].isStereo)
        {
            m_inputDsp[i].looper.ProcessStereo(m_inputDsp[i].buffer[0], m_inputDsp[i].buffer[1], m_config[m_activeConfig].channels[i].loopGainLin, transState);
        }
        else
        {
            m_inputDsp[i].looper.ProcessMono(m_inputDsp[i].buffer[0], m_config[m_activeConfig].channels[i].loopGainLin, transState);
        }
    }

    double updateGain;

    switch (phase)
    {
    case PROC_FADE_OUT:
    case PROC_CLOSING:
        // Fade Out old dsp
        for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] = m_interpolSqrt[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[0][s];
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    m_inputDsp[i].buffer[1][s] = m_interpolSqrt[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[1][s];
                }
            }
        }
        break;
    case PROC_FADE_IN:
        // Fade In new dsp
        for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] = m_interpolSqrt[s] * m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[0][s];
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    m_inputDsp[i].buffer[1][s] = m_interpolSqrt[s] * m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[1][s];
                }
            }
        }
        break;
    case PROC_UPDATING:
        // Apply new values
        for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] = (m_interpolLin[s] * m_config[m_newConfig].channels[i].gainLin + m_interpolLin[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin) * m_inputDsp[i].buffer[0][s];
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    m_inputDsp[i].buffer[1][s] = (m_interpolLin[s] * m_config[m_newConfig].channels[i].gainLin + m_interpolLin[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin) * m_inputDsp[i].buffer[1][s];
                }
            }
        }
        break;
    case PROC_NORMAL:
    default:
        // Normal processing
        for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                m_inputDsp[i].buffer[0][s] = m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[0][s];
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    m_inputDsp[i].buffer[1][s] = m_config[m_activeConfig].channels[i].gainLin * m_inputDsp[i].buffer[1][s];
                }
            }
        }
        break;
    }

    // Mix Inputs to Output
    double panL = 0.0;
    double panR = 0.0;
    double revSend = 0.0;
    double dlySend = 0.0;
    for (unsigned i = 0; i < m_config[m_activeConfig].channelCount; i++)
    {
        panR = std::sqrt(m_config[m_activeConfig].channels[i].pan / 100.0);
        panL = std::sqrt(1.0 - m_config[m_activeConfig].channels[i].pan / 100.0);
        revSend = m_config[m_activeConfig].channels[i].sendReverbLin;
        dlySend = m_config[m_activeConfig].channels[i].sendDelayLin;

        if (m_config[m_activeConfig].channels[i].isStereo)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                // Output
                m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * panL * m_inputDsp[i].buffer[0][s];
                m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * panR * m_inputDsp[i].buffer[1][s];

                // Reverb
                m_reverbBuffer[0][s] += revSend * panL * m_inputDsp[i].buffer[0][s];
                m_reverbBuffer[1][s] += revSend * panR * m_inputDsp[i].buffer[1][s];

                // Delay
                m_delayBuffer[0][s] += dlySend * panL * m_inputDsp[i].buffer[0][s];
                m_delayBuffer[1][s] += dlySend * panR * m_inputDsp[i].buffer[1][s];
            }
        }
        else
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                // Output
                m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * panL * m_inputDsp[i].buffer[0][s];
                m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * panR * m_inputDsp[i].buffer[0][s];

                // Reverb
                m_reverbBuffer[0][s] += revSend * panL * m_inputDsp[i].buffer[0][s];
                m_reverbBuffer[1][s] += revSend * panR * m_inputDsp[i].buffer[0][s];

                // Delay
                m_delayBuffer[0][s] += dlySend * panL * m_inputDsp[i].buffer[0][s];
                m_delayBuffer[1][s] += dlySend * panR * m_inputDsp[i].buffer[0][s];
            }
        }
    }

    // Reverb Processing
    ProcessReverb(nframes, m_config[m_activeConfig].reverb.rt60, m_config[m_activeConfig].reverb.type);

    // Delay Processing
    ProcessDelay(nframes, m_config[m_activeConfig].delay.delay, m_config[m_activeConfig].delay.feedback);

    for (unsigned s = 0; s < nframes; s++)
    {
        m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * m_config[m_activeConfig].reverb.gainLin * m_reverbBuffer[0][s];
        m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * m_config[m_activeConfig].reverb.gainLin * m_reverbBuffer[1][s];

        m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * m_config[m_activeConfig].delay.gainLin * m_delayBuffer[0][s];
        m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * m_config[m_activeConfig].delay.gainLin * m_delayBuffer[1][s];
    }

    // Meter
    m_meterOutLin[0] = (1.0 - m_meterCoeff) * m_meterOutLin[0] + m_meterCoeff * mck::CalcMeterLin((float *)m_bufferOut[0], nframes);
    m_meterOut[0] = mck::LinToDb(m_meterOutLin[0]);
    m_meterOutLin[1] = (1.0 - m_meterCoeff) * m_meterOutLin[1] + m_meterCoeff * mck::CalcMeterLin((float *)m_bufferOut[1], nframes);
    m_meterOut[1] = mck::LinToDb(m_meterOutLin[1]);

    // Recorder
    m_recorder.ProcessAudio(m_bufferOut[0], m_bufferOut[1], nframes);

    switch (phase)
    {
    case PROC_UPDATING:
        m_phase = PROC_NORMAL;
        m_activeConfig = m_newConfig;
        m_dataUpdate = true;
        break;
    case PROC_FADE_OUT:
        m_phase = PROC_BYPASS;
        m_activeConfig = m_newConfig;
        m_updateCond.notify_all();
        break;
    case PROC_FADE_IN:
        m_phase = PROC_NORMAL;
        break;
    case PROC_CLOSING:
        m_phase = PROC_CLOSED;
        m_updateCond.notify_all();
        break;
    default:
        break;
    }
}

void mck::Mixer::StartRecording()
{
    fs::path recPath = m_path.parent_path();
    recPath.append("recordings");
    if (fs::exists(recPath) == false)
    {
        fs::create_directories(recPath);
    }

    // Get current date
    time_t now = time(0);
    tm *ltm = localtime(&now);

    const char *fmt = "rec_%.4i_%.2i_%.2i_-_%.2i:%.2i:%.2i.wav";
    int sz = std::snprintf(nullptr, 0, fmt, 1900 + ltm->tm_year, 1 + ltm->tm_mon, ltm->tm_mday, ltm->tm_hour, ltm->tm_min, ltm->tm_sec);
    char *out = (char *)malloc((sz + 1) * sizeof(char));
    std::snprintf(out, sz + 1, fmt, 1900 + ltm->tm_year, 1 + ltm->tm_mon, ltm->tm_mday, ltm->tm_hour, ltm->tm_min, ltm->tm_sec);

    recPath.append(out);

    if (m_recorder.Start(recPath.string()))
    {
        std::printf("Recording to file %s was started!\n", recPath.c_str());
    }
}

void mck::Mixer::StopRecording()
{
    if (m_recorder.Stop())
    {
        std::printf("Recording was stopped.\n");
    }
}

void mck::Mixer::GetRealTimeData(mck::RealTimeData &r)
{
    // Metronome
    mck::MetroData tmp;
    m_metro.GetRTData(tmp);
    r.tempo.bpm = tmp.bpm;
    r.tempo.sync = tmp.sync;
    r.tempo.bar = tmp.bar;
    r.tempo.beat = tmp.beat;

    // Recorder
    m_recorder.GetState(r.rec);
    mck::Config *config = &(m_config[m_activeConfig]);

    // Transport
    m_trans.GetRTData(r.trans);

    // Metering
    if (r.meterIn.size() != config->channelCount)
    {
        r.meterIn.resize(config->channelCount);
    }
    if (r.looper.size() != config->channelCount)
    {
        r.looper.resize(config->channelCount);
    }

    for (unsigned i = 0; i < config->channelCount; i++)
    {
        r.meterIn[i].l = m_inputDsp[i].meter[0];
        if (config->channels[i].isStereo)
        {
            r.meterIn[i].r = m_inputDsp[i].meter[1];
        }
        else
        {
            r.meterIn[i].r = 0.0;
        }
        m_inputDsp[i].looper.GetRTData(r.looper[i]);
    }
    r.meterOut.l = m_meterOut[0];
    r.meterOut.r = m_meterOut[1];
}

bool mck::Mixer::DataWasUpdated()
{
    if (m_dataUpdate.load())
    {
        m_dataUpdate = false;
        return true;
    }
    return false;
}

void mck::Mixer::ProcessReverb(jack_nframes_t nframes, float rt60, unsigned type)
{
    if (type >= REV_LENGTH)
    {
        return;
    }
    switch (type)
    {
    case REV_STREV:
        if (((fv3::strev_f *)m_reverb[type])->getrt60() != rt60)
        {
            ((fv3::strev_f *)m_reverb[type])->setrt60(rt60);
        }
        break;
    case REV_PROG:
        if (((fv3::progenitor2_f *)m_reverb[type])->getrt60() != rt60)
        {
            ((fv3::progenitor2_f *)m_reverb[type])->setrt60(rt60);
        }
        break;
    case REV_ZREV:
        if (((fv3::zrev2_f *)m_reverb[type])->getrt60() != rt60)
        {
            ((fv3::zrev2_f *)m_reverb[type])->setrt60(rt60);
        }
        break;
    case REV_NREV:
        if (((fv3::nrevb_f *)m_reverb[type])->getrt60() != rt60)
        {
            ((fv3::nrevb_f *)m_reverb[type])->setrt60(rt60);
        }
        break;
    default:
        return;
    }
    m_reverb[type]->processreplace(m_reverbBuffer[0], m_reverbBuffer[1], m_reverbBuffer[0], m_reverbBuffer[1], nframes);
}

void mck::Mixer::ProcessDelay(jack_nframes_t nframes, double delay, double feedback)
{
    if (delay != m_delay.GetDelayTime())
    {
        m_delay.SetDelayTime(delay);
    }

    if (feedback != m_delay.GetFeedback())
    {
        m_delay.SetFeedback(feedback);
    }

    m_delay.ProcessAudio(m_delayBuffer[0], m_delayBuffer[1]);
}

// File Handling
bool mck::Mixer::LoadConfig(mck::Config &config, std::string path)
{
    if (fs::exists(path))
    {
        std::ifstream configFile(path);
        json j;
        configFile >> j;
        configFile.close();
        try
        {
            config = j;
            return true;
        }
        catch (std::exception &e)
        {
            std::fprintf(stderr, "Failed to read the config file: %s\n", e.what());
        }
    }
    return false;
}
bool mck::Mixer::SaveConfig(mck::Config &config, std::string path)
{
    fs::path p(path);
    // Save Configuration
    std::ofstream configFile(path);
    json j = config;
    configFile << std::setw(4) << j << std::endl;
    configFile.close();
    return true;
}

void mck::Mixer::ReceiveMessage(Message &msg)
{
    if (msg.msgType == "get")
    {
        if (msg.section == "data")
        {
            mck::Config config;
            GetConfig(config);
            m_gui->SendMessage("config", "partial", config);
        }
    }
    else if (msg.msgType == "ping")
    {
        m_gui->SendMessage("system", "pong", "");

        // Get Realtime Data
        GetRealTimeData(m_rtData);
        m_gui->SendMessage("system", "realtime", m_rtData);

        // Data Updates
        if (DataWasUpdated())
        {
            mck::Config config;
            GetConfig(config);
            m_gui->SendMessage("config", "partial", config);
        }
    }
    else if (msg.msgType == "partial" && msg.section == "config")
    {
        mck::Config config;
        try
        {
            config = json::parse(msg.data);
            SetConfig(config);
        }
        catch (std::exception &e)
        {
            std::cout << "Failed to convert the config: " << std::endl
                      << e.what() << std::endl;
            GetConfig(config);
        }
        m_gui->SendMessage("config", "partial", config);
    }
    else if (msg.msgType == "command")
    {
        if (msg.section == "control")
        {
            try
            {
                mck::ChannelControlCommand cmd = json::parse(msg.data);
                ApplyCommand(cmd);
            }
            catch (std::exception &e)
            {
                std::fprintf(stderr, "Failed to read channel control command: %s\n", e.what());
            }
        }
        else if (msg.section == "recording")
        {
            if (msg.data == "start")
            {
                StartRecording();
            }
            else if (msg.data == "stop")
            {
                StopRecording();
            }
        }
        else if (msg.section == "channel")
        {
            try
            {
                mck::Config config;
                mck::ChannelCommand cc = json::parse(msg.data);
                if (cc.command == "add")
                {
                    AddChannel(cc.isStereo, config);
                }
                else if (cc.command == "remove")
                {
                    RemoveChannel(cc.idx, config);
                }
                else
                {
                    return;
                }

                m_gui->SendMessage("config", "partial", config);
            }
            catch (std::exception &e)
            {
                std::fprintf(stderr, "Failed to read channel command: %s\n", e.what());
            }
        }
        else if (msg.section == "connection")
        {
            try
            {
                mck::Config config;
                mck::ConnectionCommand cc = json::parse(msg.data);
                ApplyCommand(cc, config);
                m_gui->SendMessage("config", "partial", config);
            }
            catch (std::exception &e)
            {
                std::fprintf(stderr, "Failed to read connection command: %s\n", e.what());
            }
        }
        else if (msg.section == "loop")
        {
            try
            {
                mck::LoopCommand lc = json::parse(msg.data);
                ApplyCommand(lc);
            }
            catch (std::exception &e)
            {
                std::fprintf(stderr, "Failed to read loop command: %s\n", e.what());
            }
        }
        else if (msg.section == "transport")
        {
            try
            {
                mck::TransportCommand tc = json::parse(msg.data);
                ApplyCommand(tc);
            }
            catch (std::exception &e)
            {
                std::fprintf(stderr, "Failed to read transport command: %s\n", e.what());
            }
        }
    }
    else if (msg.msgType == "request")
    {
        if (msg.section == "source")
        {
            std::vector<std::string> cons;
            mck::GetInputPorts(GetClient(), cons);
            m_gui->SendMessage("source", "partial", cons);
        }
        else if (msg.section == "target")
        {
            std::vector<std::string> cons;
            mck::GetOutputPorts(GetClient(), cons);
            m_gui->SendMessage("target", "partial", cons);
        }
    }
}