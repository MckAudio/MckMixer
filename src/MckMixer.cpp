#include "MckMixer.h"

static int process(jack_nframes_t nframes, void *arg)
{
    ((mck::Mixer *)arg)->ProcessAudio(nframes);
    return 0;
}

mck::Mixer::Mixer()
    : m_isInitialized(false), m_bufferSize(0), m_sampleRate(0), m_activeConfig(0), m_newConfig(1), m_nInputChans(), m_updateCount(false)
{
    m_nInputChans[0] = 0;
    m_nInputChans[1] = 0;
    m_updateValues = false;
}

bool mck::Mixer::Init(std::string path)
{
    if (m_isInitialized)
    {
        std::fprintf(stderr, "MixerModule is already initialize\n");
        return false;
    }

    // Malloc Audio Inputs
    m_audioIn = (jack_port_t **)malloc(MCK_MIXER_MAX_INPUTS * sizeof(jack_port_t *));
    memset(m_audioIn, 0, MCK_MIXER_MAX_INPUTS * sizeof(jack_port_t *));
    m_bufferIn = (jack_default_audio_sample_t **)malloc(MCK_MIXER_MAX_INPUTS * sizeof(jack_nframes_t *));
    memset(m_bufferIn, 0, MCK_MIXER_MAX_INPUTS * sizeof(jack_nframes_t *));

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

    m_bufferSize = jack_get_buffer_size(m_client);
    m_sampleRate = jack_get_sample_rate(m_client);

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

    m_reverb = new fv3::strev_f();
    m_reverb->setSampleRate(m_sampleRate);
    m_reverb->setwet(0.0);
    m_reverb->setdry(-200.0);

    // Read Configuration
    mck::Config newConfig;
    bool createFile = LoadConfig(newConfig, path) == false;

    if (createFile)
    {
        SaveConfig(newConfig, path);
    }

    m_path = fs::path(path);

    SetConfig(newConfig);

    if (jack_activate(m_client))
    {
        std::fprintf(stderr, "Unable to activate JACK client!\n");
        return false;
    }

    m_isInitialized = true;
    return true;
}

void mck::Mixer::Close()
{
    if (m_isInitialized == false)
    {
        return;
    }

    SaveConfig(m_config[m_activeConfig], m_path.string());

    // Save Connections here

    if (m_client != nullptr)
    {
        jack_client_close(m_client);
    }

    free(m_audioIn);
    free(m_interpolLin);
    free(m_interpolSqrt);

    free(m_reverbBuffer[0]);
    free(m_reverbBuffer[1]);
    free(m_delayBuffer[0]);
    free(m_delayBuffer[1]);

    m_isInitialized = false;
}

bool mck::Mixer::SetConfig(mck::Config &config)
{
    if (m_updateValues.load())
    {
        std::fprintf(stderr, "MckMixer is updating...\n");
        return false;
    }

    unsigned nChans = 0;
    m_newConfig = 1 - m_activeConfig;

    // Convert Gain dB to lin
    if (config.gain <= -200.0)
    {
        config.gainLin = 0.0;
        config.gain = -200.0;
    }
    else
    {
        config.gainLin = std::pow(10.0, config.gain / 20.0);
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

        if (config.channels[i].gain <= -200.0)
        {
            config.channels[i].gainLin = 0.0;
            config.channels[i].gain = -200.0;
        }
        else
        {
            config.channels[i].gainLin = std::pow(10.0, config.channels[i].gain / 20.0);
        }

        if (config.channels[i].send <= -200.0)
        {
            config.channels[i].sendLin = 0.0;
            config.channels[i].send = -200.0;
        }
        else
        {
            config.channels[i].sendLin = std::pow(10.0, config.channels[i].send / 20.0);
        }
    }
    config.channelCount = config.channels.size();
    m_config[m_newConfig] = config;
    m_nInputChans[m_newConfig] = nChans;

    if (m_nInputChans[m_newConfig] > m_nInputChans[m_activeConfig])
    {
        std::string name = "";
        for (unsigned i = m_nInputChans[m_activeConfig]; i < m_nInputChans[m_newConfig]; i++)
        {
            name = "audio_in_" + std::to_string(i + 1);
            m_audioIn[i] = jack_port_register(m_client, name.c_str(), JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
        }
    }

    m_updateValues = true;

    SaveConfig(config, m_path.string());

    return true;
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

    if (ret == false) {
        GetConfig(outConfig);
    }

    return ret;
}

bool mck::Mixer::RemoveChannel(unsigned idx, mck::Config &outConfig)
{
    return false;
}

void mck::Mixer::ProcessAudio(jack_nframes_t nframes)
{
    bool updateValues = m_updateValues.load();

    // Output Channels
    m_bufferOut[0] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_audioOut[0], nframes);
    m_bufferOut[1] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_audioOut[1], nframes);

    // Reset
    memset(m_bufferOut[0], 0, nframes * sizeof(jack_default_audio_sample_t));
    memset(m_bufferOut[1], 0, nframes * sizeof(jack_default_audio_sample_t));

    memset(m_reverbBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_reverbBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    memset(m_delayBuffer[0], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));
    memset(m_delayBuffer[1], 0, m_bufferSize * sizeof(jack_default_audio_sample_t));

    // Input Channels
    for (unsigned i = 0; i < m_nInputChans[m_activeConfig]; i++)
    {
        m_bufferIn[i] = (jack_default_audio_sample_t *)jack_port_get_buffer(m_audioIn[i], nframes);
    }

    double updateGain;
    if (updateValues)
    {
        m_updateCount = m_nInputChans[m_activeConfig] != m_nInputChans[m_newConfig];
    }

    // Input Processing
    if (updateValues)
    {
        if (m_updateCount)
        {
            for (unsigned i = 0, jackIdx = 0; i < m_config[m_activeConfig].channelCount; i++, jackIdx++)
            {
                for (unsigned s = 0; s < nframes; s++)
                {
                    m_bufferIn[jackIdx][s] = m_interpolSqrt[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                }
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    jackIdx += 1;
                    for (unsigned s = 0; s < nframes; s++)
                    {
                        m_bufferIn[jackIdx][s] = m_interpolSqrt[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                    }
                }
            }
        }
        else
        {
            for (unsigned i = 0, j = 0; i < m_config[m_activeConfig].channelCount; i++, j++)
            {
                for (unsigned s = 0; s < nframes; s++)
                {
                    m_bufferIn[j][s] = (m_interpolLin[s] * m_config[m_newConfig].channels[i].gainLin + m_interpolLin[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin) * m_bufferIn[j][s];
                }
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    j++;
                    for (unsigned s = 0; s < nframes; s++)
                    {
                        m_bufferIn[j][s] = (m_interpolLin[s] * m_config[m_newConfig].channels[i].gainLin + m_interpolLin[nframes - s - 1] * m_config[m_activeConfig].channels[i].gainLin) * m_bufferIn[j][s];
                    }
                }
            }
        }
    }
    else
    {
        if (m_updateCount)
        {
            for (unsigned i = 0, jackIdx = 0; i < m_config[m_activeConfig].channelCount; i++, jackIdx++)
            {
                for (unsigned s = 0; s < nframes; s++)
                {
                    m_bufferIn[jackIdx][s] = m_interpolSqrt[s] * m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                }
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    jackIdx += 1;
                    for (unsigned s = 0; s < nframes; s++)
                    {
                        m_bufferIn[jackIdx][s] = m_interpolSqrt[s] * m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                    }
                }
            }
        }
        else
        {
            for (unsigned i = 0, jackIdx = 0; i < m_config[m_activeConfig].channelCount; i++, jackIdx++)
            {
                for (unsigned s = 0; s < nframes; s++)
                {
                    m_bufferIn[jackIdx][s] = m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                }
                if (m_config[m_activeConfig].channels[i].isStereo)
                {
                    jackIdx += 1;
                    for (unsigned s = 0; s < nframes; s++)
                    {
                        m_bufferIn[jackIdx][s] = m_config[m_activeConfig].channels[i].gainLin * m_bufferIn[jackIdx][s];
                    }
                }
            }
        }
    }

    // Mix Inputs to Output
    double panL = 0.0;
    double panR = 0.0;
    double revSend = 0.0;
    double dlySend = 0.0;
    for (unsigned i = 0, j = 0; i < m_config[m_activeConfig].channelCount; i++, j++)
    {
        panR = std::sqrt(m_config[m_activeConfig].channels[i].pan / 100.0);
        panL = std::sqrt(1.0 - m_config[m_activeConfig].channels[i].pan / 100.0);
        revSend = m_config[m_activeConfig].channels[i].sendLin;

        if (m_config[m_activeConfig].channels[i].isStereo)
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                // Output
                m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * panL * m_bufferIn[j][s];
                m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * panR * m_bufferIn[j + 1][s];

                // Reverb
                m_reverbBuffer[0][s] += revSend * panL * m_bufferIn[j][s];
                m_reverbBuffer[1][s] += revSend * panR * m_bufferIn[j + 1][s];
            }

            j++;
        }
        else
        {
            for (unsigned s = 0; s < nframes; s++)
            {
                // Output
                m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * panL * m_bufferIn[j][s];
                m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * panR * m_bufferIn[j][s];

                // Reverb
                m_reverbBuffer[0][s] += revSend * panL * m_bufferIn[j][s];
                m_reverbBuffer[1][s] += revSend * panR * m_bufferIn[j][s];
            }
        }
    }

    // Reverb Processing
    ProcessReverb(nframes, m_config[m_activeConfig].reverb.rt60);
    for (unsigned s = 0; s < nframes; s++)
    {
        m_bufferOut[0][s] += m_config[m_activeConfig].gainLin * m_reverbBuffer[0][s];
        m_bufferOut[1][s] += m_config[m_activeConfig].gainLin * m_reverbBuffer[1][s];
    }

    if (updateValues)
    {
        m_updateValues = false;
        m_activeConfig = m_newConfig;
    }
    else if (m_updateCount)
    {
        m_updateCount = false;
    }

    /*
    jack_default_audio_sample_t *in_l = (jack_default_audio_sample_t *)jack_port_get_buffer(audio_in_l, nframes);
    jack_default_audio_sample_t *in_r = (jack_default_audio_sample_t *)jack_port_get_buffer(audio_in_r, nframes);
    jack_default_audio_sample_t *out_l = (jack_default_audio_sample_t *)jack_port_get_buffer(audio_out_l, nframes);
    jack_default_audio_sample_t *out_r = (jack_default_audio_sample_t *)jack_port_get_buffer(audio_out_r, nframes);

    reverb->processreplace(in_l, in_r, out_l, out_r, nframes);*/
}

void mck::Mixer::ProcessReverb(jack_nframes_t nframes, float rt60)
{
    if (((fv3::strev_f *)m_reverb)->getrt60() != rt60) {
        ((fv3::strev_f *)m_reverb)->setrt60(rt60);
    }
    m_reverb->processreplace(m_reverbBuffer[0], m_reverbBuffer[1], m_reverbBuffer[0], m_reverbBuffer[1], nframes);
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