#include "MckControl.h"
#include "MckLooper.h"
#include <Transport.hpp>

mck::Control::Control()
    : m_isInitialized(true),
      m_looper(),
      m_trans(nullptr)
{
    m_looper.clear();
}

bool mck::Control::ProcessMidi(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged, ControlState &state)
{
    void *inBuffer = jack_port_get_buffer(inPort, nframes);
    void *outBuf = jack_port_get_buffer(outPort, nframes);
    jack_midi_clear_buffer(outBuf);

    unsigned frame = 0;

    if (m_state.state == CS_LEARNING)
    {
    }

    // Apply Data Changes
    if (configChanged)
    {
        ApplyDataChanges(outBuf, config);
        configChanged = false;
    }

    bool found = false;
    char newMode = config.controls.activeMode;
    // Get Controller Changes
    jack_nframes_t evtCount = jack_midi_get_event_count(inBuffer);
    jack_midi_event_t evt;
    bool isNoteOn = false;
    bool isNoteOff = false;
    for (unsigned i = 0; i < evtCount; i++)
    {
        found = false;
        jack_midi_event_get(&evt, inBuffer, i);
        isNoteOff = (evt.buffer[0] & 0xf0) == 128;
        for (unsigned j = 0; j < config.controls.numMode; j++)
        {
            if (config.controls.mode[j].set == false)
            {
                continue;
            }
            isNoteOn = (config.controls.mode[j].head & 0xf0) == 144;
            if (isNoteOff)
            {
                if (isNoteOn && (config.controls.mode[j].head & 0x0f) == (evt.buffer[0] & 0x0f))
                {
                    if (evt.buffer[1] == config.controls.mode[j].data)
                    {
                        newMode = j;
                        found = true;
                        break;
                    }
                }
            }
            else if (isNoteOn)
            {
            }
            else if (evt.buffer[0] == config.controls.mode[j].head)
            {
                if (evt.buffer[1] == config.controls.mode[j].data)
                {
                    if (evt.buffer[2] > 0x3f)
                    {
                        newMode = j;
                        found = true;
                        break;
                    }
                }
            }
        }
        if (found)
        {
            continue;
        }

        for (unsigned j = 0; j < config.controls.numCombo; j++)
        {
            if (config.controls.combo[j].rotary.set == false)
            {
                continue;
            }
            if (evt.buffer[0] == config.controls.combo[j].rotary.head)
            {
                if (evt.buffer[1] == config.controls.combo[j].rotary.data)
                {
                    char val = evt.buffer[2] & 0x7F;
                    unsigned idx = j;
                    switch (config.controls.activeMode)
                    {
                    case CM_GAIN:
                        idx += config.controls.activeChannel;
                        if (idx < config.channelCount)
                        {
                            config.channels[idx].gain = LogToDb((double)val / 127.0);
                            configChanged = true;
                            found = true;
                        }
                        break;
                    case CM_PAN:
                        idx += config.controls.activeChannel;
                        if (idx < config.channelCount)
                        {
                            config.channels[idx].pan = ((double)val / 127.0 * 100.0);
                            configChanged = true;
                            found = true;
                        }
                        break;
                    case CM_REVERB:
                        idx += config.controls.activeChannel;
                        if (idx < config.channelCount)
                        {
                            config.channels[idx].sendReverb = LogToDb((double)val / 127.0);
                            configChanged = true;
                            found = true;
                        }
                        break;
                    case CM_DELAY:
                        idx += config.controls.activeChannel;
                        if (idx < config.channelCount)
                        {
                            config.channels[idx].sendDelay = LogToDb((double)val / 127.0);
                            configChanged = true;
                            found = true;
                        }
                        break;

                    default:
                        break;
                    }
                }
            }
            if (found)
            {
                break;
            }
        }
    }

    if (newMode != config.controls.activeMode)
    {
        config.controls.activeMode = newMode;
        ApplyDataChanges(outBuf, config);
        configChanged = true;
    }

    return true;
}

bool mck::Control::ApplyCommand(ControlCommand &cmd)
{
    switch (cmd.type)
    {
    default:
        break;
    }
    return true;
}

void mck::Control::AddLooper(Looper *looper)
{
    m_looper.push_back(looper);
}

void mck::Control::SetTransport(Transport *trans)
{
    m_trans = trans;
}

bool mck::Control::Process(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged)
{
    void *inBuffer = jack_port_get_buffer(inPort, nframes);
    void *outBuf = jack_port_get_buffer(outPort, nframes);
    jack_midi_clear_buffer(outBuf);

    unsigned frame = 0;

    // Apply Data Changes
    if (configChanged)
    {
        //ApplyDataChanges(outBuf, config);
        configChanged = false;
    }

    bool found = false;
    char newMode = config.controls.activeMode;
    // Get Controller Changes
    jack_nframes_t evtCount = jack_midi_get_event_count(inBuffer);
    jack_midi_event_t midiEvent;
    bool isNoteOn = false;
    bool isNoteOff = false;

    for (unsigned i = 0; i < evtCount; i++)
    {
        int ret = jack_midi_event_get(&midiEvent, inBuffer, i);
        if (ret != 0)
        {
            continue;
        }
        if (midiEvent.size < 2)
        {
            continue;
        }
        MidiControl ctrl;
        ctrl.learn = false;
        ctrl.chan = midiEvent.buffer[0] & 0x0F;
        ctrl.head = midiEvent.buffer[0] & 0xF0;
        ctrl.data = midiEvent.buffer[1];
        ctrl.set = true;

        double value = 0.0;
        if (ctrl.head == 0xB0)
        {
            value = (double)midiEvent.buffer[2] / 127.0;
        }

        if (config.channelControls.learn)
        {
            if (ctrl.head != 0x80 && ctrl.head != 0x90 && ctrl.head != 0xB0)
            {
                continue;
            }

            for (auto &chanCtrl : config.channelControls.controls)
            {
                if (chanCtrl.learn)
                {
                    chanCtrl = ctrl;
                    break;
                }
            }

            config.channelControls.learn = false;
            configChanged = true;
        }
        else
        {
            // SWITCH ETC.
            for (unsigned i = 0; i < config.channelControls.controls.size(); i++)
            {
                unsigned idx = config.channelControls.activeChannel;
                if (config.channelControls.controls[i] == ctrl)
                {
                    switch (i)
                    {
                    case CCT_PREV_CHANNEL:
                        config.channelControls.activeMaster = false;
                        config.channelControls.activeChannel = (unsigned)(((int)config.channelControls.activeChannel - 1) % config.channelCount);
                        configChanged = true;
                        break;
                    case CCT_NEXT_CHANNEL:
                        config.channelControls.activeMaster = false;
                        config.channelControls.activeChannel = (config.channelControls.activeChannel + 1) % config.channelCount;
                        configChanged = true;
                        break;
                    case CCT_TOGGLE_MASTER:
                        config.channelControls.activeMaster = !config.channelControls.activeMaster;
                        configChanged = true;
                        break;
                    case CCT_PREV_GAIN:
                        config.channelControls.activeGainCtrl = (unsigned)(((int)config.channelControls.activeGainCtrl - 1) % GCT_LENGTH);
                        configChanged = true;
                        break;
                    case CCT_NEXT_GAIN:
                        config.channelControls.activeGainCtrl = (unsigned)(((int)config.channelControls.activeGainCtrl + 1) % GCT_LENGTH);
                        configChanged = true;
                        break;
                    case CCT_GAIN_CTRL:
                        switch (config.channelControls.activeGainCtrl)
                        {
                        case GCT_GAIN:
                            config.channels[idx].gain = LogToDb(value);
                            config.channels[idx].gainLin = DbToLin(config.channels[idx].gain);
                            configChanged = true;
                            break;
                        case GCT_PAN:
                            config.channels[idx].pan = value * 100.0;
                            configChanged = true;
                            break;
                        case GCT_LOOP:
                            config.channels[idx].loopGain = LogToDb(value);
                            config.channels[idx].loopGainLin = DbToLin(config.channels[idx].loopGain);
                            configChanged = true;
                            break;
                        case GCT_INPUT:
                            config.channels[idx].inputGain = LogToDb(value);
                            config.channels[idx].inputGainLin = DbToLin(config.channels[idx].inputGain);
                            configChanged = true;
                            break;
                        case GCT_REVERB:
                            config.channels[idx].sendReverb = LogToDb(value);
                            config.channels[idx].sendReverbLin = DbToLin(config.channels[idx].sendReverb);
                            configChanged = true;
                            break;
                        case GCT_DELAY:
                            config.channels[idx].sendDelay = LogToDb(value);
                            config.channels[idx].sendDelayLin = DbToLin(config.channels[idx].sendDelay);
                            configChanged = true;
                            break;
                        default:
                            break;
                        }
                        break;
                    case CCT_LOOP_RECORD:
                        if (config.channelControls.activeMaster)
                        {

                        }
                        else if (idx < m_looper.size() && m_looper[idx] != nullptr)
                        {
                            LoopCommand cmd;
                            cmd.chanIdx = idx;
                            cmd.loopIdx = 0;
                            cmd.mode = LOOP_RECORD;
                            m_looper[idx]->ApplyCommand(cmd, config.channels[idx].isStereo);
                        }
                        break;
                    case CCT_LOOP_START:
                        if (config.channelControls.activeMaster)
                        {
                            TransportCommand cmd;
                            cmd.mode = TC_START;
                            if (m_trans != nullptr)
                            {
                                m_trans->ApplyCommand(cmd);
                            }
                        }
                        else if (idx < m_looper.size() && m_looper[idx] != nullptr)
                        {
                            LoopCommand cmd;
                            cmd.chanIdx = idx;
                            cmd.loopIdx = 0;
                            cmd.mode = LOOP_PLAY;
                            m_looper[idx]->ApplyCommand(cmd, config.channels[idx].isStereo);
                        }
                        break;
                    case CCT_LOOP_STOP:
                        if (config.channelControls.activeMaster)
                        {
                            TransportCommand cmd;
                            cmd.mode = TC_STOP;
                            if (m_trans != nullptr)
                            {
                                m_trans->ApplyCommand(cmd);
                            }
                        }
                        else if (idx < m_looper.size() && m_looper[idx] != nullptr)
                        {
                            LoopCommand cmd;
                            cmd.chanIdx = idx;
                            cmd.loopIdx = 0;
                            cmd.mode = LOOP_STOP;
                            m_looper[idx]->ApplyCommand(cmd, config.channels[idx].isStereo);
                        }
                        break;
                    default:
                        break;
                    }
                }
            }
        }
    }
    return true;
}

bool mck::Control::ApplyCommand(ChannelControlCommand &cmd)
{
    switch (cmd.type)
    {
    default:
        break;
    }
    return true;
}

void mck::Control::ApplyDataChanges(void *outBuf, Config &config)
{
    unsigned frame = 0;
    // Update all midi controls
    bool mute = false;
    double gain = -200.0;
    double pan = 50.0;
    unsigned idx = 0;
    unsigned char *buf;

    // Set Mode
    for (unsigned i = 0; i < config.controls.numMode; i++)
    {
        if (config.controls.mode[i].set == false)
        {
            continue;
        }

        buf = jack_midi_event_reserve(outBuf, frame++, 3);
        buf[0] = config.controls.mode[i].head;
        buf[1] = config.controls.mode[i].data;
        if (i == config.controls.activeMode)
        {
            buf[2] = 0x7f;
        }
        else
        {
            buf[2] = 0x00;
        }
    }

    // Set Active Modes
    switch (config.controls.activeMode)
    {
    case CM_CHANNEL:

        break;
    case CM_GAIN:
        for (unsigned i = 0; i < config.controls.numCombo; i++)
        {
            gain = -200.0;
            mute = false;
            idx = i + config.controls.activeChannel;
            if (idx < config.channelCount)
            {
                mute = config.channels[idx].mute;
                gain = config.channels[idx].gain;
            }
            if (config.controls.combo[i].rotary.set)
            {
                buf = jack_midi_event_reserve(outBuf, frame++, 3);
                buf[0] = config.controls.combo[i].rotary.head;
                buf[1] = config.controls.combo[i].rotary.data;
                buf[2] = ((unsigned char)std::round(DbToLog(gain) * 127.0)) & 0x7F;
            }
            if (config.controls.combo[i].push.set)
            {
                buf = jack_midi_event_reserve(outBuf, frame++, 3);
                buf[0] = config.controls.combo[i].push.head;
                buf[1] = config.controls.combo[i].push.data;
                buf[2] = mute ? 127 : 0;
            }
        }
        break;
    case CM_PAN:
        for (unsigned i = 0; i < config.controls.numCombo; i++)
        {
            pan = 50.0;
            idx = i + config.controls.activeChannel;
            if (idx < config.channelCount)
            {
                pan = config.channels[idx].pan;
            }
            if (config.controls.combo[i].rotary.set)
            {
                buf = jack_midi_event_reserve(outBuf, frame++, 3);
                buf[0] = config.controls.combo[i].rotary.head;
                buf[1] = config.controls.combo[i].rotary.data;
                buf[2] = ((unsigned char)std::round(pan / 100.0 * 127.0)) & 0x7F;
            }
        }
        break;
    case CM_REVERB:
        for (unsigned i = 0; i < config.controls.numCombo; i++)
        {
            gain = -200.0;
            idx = i + config.controls.activeChannel;
            if (idx < config.channelCount)
            {
                gain = config.channels[idx].sendReverb;
            }
            if (config.controls.combo[i].rotary.set)
            {
                buf = jack_midi_event_reserve(outBuf, frame++, 3);
                buf[0] = config.controls.combo[i].rotary.head;
                buf[1] = config.controls.combo[i].rotary.data;
                buf[2] = ((unsigned char)std::round(DbToLog(gain) * 127.0)) & 0x7F;
            }
        }
        break;
    case CM_DELAY:
        for (unsigned i = 0; i < config.controls.numCombo; i++)
        {
            gain = -200.0;
            idx = i + config.controls.activeChannel;
            if (idx < config.channelCount)
            {
                gain = config.channels[idx].sendDelay;
            }
            if (config.controls.combo[i].rotary.set)
            {
                buf = jack_midi_event_reserve(outBuf, frame++, 3);
                buf[0] = config.controls.combo[i].rotary.head;
                buf[1] = config.controls.combo[i].rotary.data;
                buf[2] = ((unsigned char)std::round(DbToLog(gain) * 127.0)) & 0x7F;
            }
        }
        break;
    default:
        break;
    }
}