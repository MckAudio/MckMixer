#include "MckTransport.h"

mck::Transport::Transport()
    : m_isInitialized(false), m_buffersize(0), m_samplerate(0), m_lastPulse(0), m_numPulses(24), m_beatsPerBar(4), m_bar(0), m_beat(0), m_beatOffset(0), m_nextPulse(0), m_update(false), m_idx(0), m_state(TS_IDLE), m_cmd(TC_NOTHING)
{
}

bool mck::Transport::Init(unsigned samplerate, unsigned buffersize, double tempo)
{
    if (m_isInitialized)
    {
        return false;
    }

    m_buffersize = buffersize;
    m_samplerate = samplerate;

    CalcData(tempo);

    m_isInitialized = true;
    return true;
}

void mck::Transport::Process(jack_port_t *port, jack_nframes_t nframes, TransportState &ts)
{
    if (m_isInitialized == false)
    {
        return;
    }

    char state = m_state.load();
    char cmd = m_cmd.load();
    unsigned pulseLen = m_pulseLen.load();

    unsigned char *buffer;
    void *outBuffer = jack_port_get_buffer(port, nframes);
    jack_midi_clear_buffer(outBuffer);

    switch (cmd)
    {
    case TC_START:
        m_bar = 0;
        m_beat = 0;
        m_pulse = 0;
        m_nextPulse = 0;
        state = TS_RUNNING;
        m_cmd = TC_NOTHING;
        // Send MIDI clock command
        buffer = jack_midi_event_reserve(outBuffer, 0, 1);
        buffer[0] = 0xFA;

        break;
    case TC_CONTINUE:
        state = TS_RUNNING;
        m_cmd = TC_NOTHING;
        // Send MIDI clock command
        buffer = jack_midi_event_reserve(outBuffer, 0, 1);
        buffer[0] = 0xFB;
        break;
    case TC_STOP:
        state = TS_IDLE;
        m_cmd = TC_NOTHING;
        // Send MIDI clock command
        buffer = jack_midi_event_reserve(outBuffer, 0, 1);
        buffer[0] = 0xFC;
        break;
    default:
        break;
    }

    m_beatOffset += m_buffersize;
    bool pulseSet = false;

    if (state == TS_RUNNING)
    {
        unsigned samp = 0;

        while (true)
        {
            if (m_nextPulse < m_buffersize)
            {
                samp = m_nextPulse;
                m_pulse += 1;
                pulseSet = true;
                m_lastPulse = samp;
                // Count pulses, beats & bars
                if (m_pulse >= m_numPulses)
                {
                    m_pulse = 0;
                    m_beat += 1;
                    m_beatOffset = samp;
                    if (m_beat >= m_beatsPerBar)
                    {
                        m_beat = 0;
                        m_bar = m_bar.load() + 1;
                    }
                }
                // Send MIDI clock
                buffer = jack_midi_event_reserve(outBuffer, samp, 1);
                buffer[0] = 0xF8;

                // Calc time to next pulse
                m_nextPulse = samp + pulseLen;
            }
            else
            {
                m_nextPulse -= m_buffersize;
                break;
            }
        }

        if (pulseSet == false) {
            m_lastPulse += m_buffersize;
        }
    }

    ts.state = state;
    ts.pulseIdx = m_lastPulse;
    ts.pulse = m_pulse;
    ts.nPulses = m_numPulses;
    ts.pulseLen = pulseLen;
    ts.beat = m_beat;
    ts.nBeats = m_beatsPerBar;
    ts.beatLen = ts.pulseLen * ts.nPulses;
    ts.bar = m_bar.load();
    ts.barLen = ts.beatLen * ts.nBeats;

    m_state = state;
}

bool mck::Transport::ApplyCommand(TransportCommand &cmd)
{
    char state = m_state.load();
    switch (cmd.mode)
    {
    case TC_STOP:
        if (state == TS_RUNNING)
        {
            m_cmd = TC_STOP;
            return true;
        }
        break;
    case TC_START:
        if (state == TS_IDLE)
        {
            m_cmd = TC_START;
            return true;
        }
        break;
    case TC_CONTINUE:
        if (state == TS_IDLE)
        {
            m_cmd = TC_CONTINUE;
            return true;
        }
        break;
    case TC_TEMPO:
        CalcData(cmd.tempo);
        return true;
        break;
    }
    return false;
}

bool mck::Transport::GetRTData(TransportState &rt)
{
    if (m_isInitialized == false)
    {
        return false;
    }
    rt.bar = m_bar;
    rt.beat = m_beat;
    rt.state = m_state.load();
    rt.nBeats = m_beatsPerBar;
    rt.tempo = m_tempo.load();

    return true;
}

bool mck::Transport::GetBeat(Beat &b)
{
    if (m_isInitialized == false)
    {
        return false;
    }

    b.num = m_beat;
    b.off = m_beatOffset;

    return true;
}

void mck::Transport::CalcData(double tempo)
{
    m_pulseLen = (unsigned)std::round(((double)m_samplerate / tempo) * (60.0 / (double)m_numPulses));
    m_tempo = tempo;
}