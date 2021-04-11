#include "MckLooper.h"

mck::Looper::Looper() : m_isInitialized(false), m_buffersize(0), m_samplerate(0), m_trans(nullptr), m_state(LS_IDLE), m_activeLoop(0) {}

mck::Looper::~Looper()
{
    // Free
    if (m_isInitialized)
    {
        free(m_buffer);
    }
}

void mck::Looper::Init(unsigned samplerate, unsigned buffersize, Transport *trans)
{
    if (m_isInitialized)
    {
        return;
    }
    m_trans = trans;
    m_buffersize = buffersize;
    m_samplerate = samplerate;

    m_buffer = (jack_default_audio_sample_t *)malloc(MAX_LOOPER_BUFFER_LEN * sizeof(jack_default_audio_sample_t));
    memset(m_buffer, 0, MAX_LOOPER_BUFFER_LEN * sizeof(jack_default_audio_sample_t));

    m_loops.reserve(MAX_NUM_LOOPS);

    m_isInitialized = true;

    return;
}

bool mck::Looper::ProcessMono(jack_default_audio_sample_t *inOut, double gainLin, TransportState &ts)
{
    return ProcessStereo(inOut, nullptr, gainLin, ts);
}

bool mck::Looper::ProcessStereo(jack_default_audio_sample_t *inOutL, jack_default_audio_sample_t *inOutR, double gainLin, TransportState &ts)
{
    if (m_isInitialized == false)
    {
        return false;
    }

    char state = m_state.load();
    char loopIdx = m_activeLoop.load();
    bool ready = (ts.beat == 0) && (ts.pulse == 0) && (ts.pulseIdx < m_buffersize);

    bool record = false;
    bool play = false;
    unsigned offset = 0;
    unsigned len = 0;

    switch (state)
    {
    case LS_SHOULD_RECORD:
        if (ready)
        {
            record = true;
            offset = ts.pulseIdx;
            len = m_buffersize - offset;
            m_loops[loopIdx].idx = 0;
            m_loops[loopIdx].len = 0;
            m_state = LS_RECORD;
        }
        break;
    case LS_RECORD:
        record = true;
        offset = 0;
        len = m_buffersize;
        break;
    case LS_SHOULD_STOP_RECORD:
        record = true;
        offset = 0;
        if (ready)
        {
            len = m_buffersize - ts.pulseIdx;
            m_state = LS_IDLE;
        }
        else
        {
            len = m_buffersize;
        }
        break;
    case LS_SHOULD_PLAY:
        if (ready)
        {
            play = true;
            offset = ts.pulseIdx;
            len = m_buffersize - offset;
            m_loops[loopIdx].idx = 0;
            m_state = LS_PLAY;
        }
        break;
    case LS_PLAY:
        play = true;
        offset = 0;
        len = m_buffersize;
        break;
        break;
    case LS_SHOULD_STOP_PLAY:
        play = true;
        offset = 0;
        if (ready)
        {
            len = m_buffersize - ts.pulseIdx;
            m_state = LS_IDLE;
        }
        else
        {
            len = m_buffersize;
        }
        break;
    default:
        break;
    }

    if (record)
    {
        memcpy(m_loops[loopIdx].buffer[0] + m_loops[loopIdx].idx, inOutL + offset, len * sizeof(jack_default_audio_sample_t));
        if (m_loops[loopIdx].isStereo && inOutR != nullptr)
        {
            memcpy(m_loops[loopIdx].buffer[1] + m_loops[loopIdx].idx, inOutR + offset, len * sizeof(jack_default_audio_sample_t));
        }
        m_loops[loopIdx].idx += len;
        m_loops[loopIdx].len += len;
    }
    else if (play)
    {
        bool stereo = m_loops[loopIdx].isStereo && inOutR != nullptr;

        // Check length of buffer
        unsigned samplesLeft = m_loops[loopIdx].len - m_loops[loopIdx].idx;
        unsigned origLen = len;
        len = std::min(len, samplesLeft);

        for (unsigned i = offset; i < offset + len; i++)
        {
            inOutL[i] += m_loops[loopIdx].buffer[0][m_loops[loopIdx].idx + i] * gainLin;
            if (stereo)
            {
                inOutR[i] += m_loops[loopIdx].buffer[1][m_loops[loopIdx].idx + i] * gainLin;
            }
        }
        m_loops[loopIdx].idx += len;

        // Loop
        if (origLen > samplesLeft)
        {
            if (ts.beat == 0)
            {
                m_loops[loopIdx].idx = 0;
                offset = ts.pulseIdx + (ts.pulseLen * ts.pulse);
                len = m_buffersize - len;

                for (unsigned i = offset; i < offset + len; i++)
                {
                    inOutL[i] += m_loops[loopIdx].buffer[0][m_loops[loopIdx].idx + i] * gainLin;
                    if (stereo)
                    {
                        inOutR[i] += m_loops[loopIdx].buffer[1][m_loops[loopIdx].idx + i] * gainLin;
                    }
                }
                m_loops[loopIdx].idx += len;
            }
            else
            {
                m_state = LS_SHOULD_PLAY;
            }
        }
    }

    return true;
}

bool mck::Looper::ApplyCommand(LoopCommand &cmd, bool isStereo = false)
{
    if (m_isInitialized == false)
    {
        return false;
    }
    char state = m_state.load();

    std::printf("[LOOP]: Received a command #%d - state %d.\n", cmd.mode, state);

    switch (cmd.mode)
    {
    case LOOP_PLAY:
        if (state == LS_IDLE && cmd.loopIdx < m_loops.size())
        {
            m_activeLoop = cmd.loopIdx;
            m_state = LS_SHOULD_PLAY;
            return true;
        }
        break;
    case LOOP_RECORD:
        if (state == LS_IDLE && cmd.loopIdx < MAX_NUM_LOOPS)
        {
            if (m_loops.size() <= cmd.loopIdx)
            {
                m_loops.resize(cmd.loopIdx + 1);
                m_loops[cmd.loopIdx].isStereo = isStereo;
                m_loops[cmd.loopIdx].buffer[0] = (jack_default_audio_sample_t *)malloc(MAX_LOOPER_BUFFER_LEN * m_samplerate * sizeof(jack_default_audio_sample_t));
                memset(m_loops[cmd.loopIdx].buffer[0], 0, MAX_LOOPER_BUFFER_LEN * m_samplerate * sizeof(jack_default_audio_sample_t));
                if (isStereo)
                {
                    m_loops[cmd.loopIdx].buffer[1] = (jack_default_audio_sample_t *)malloc(MAX_LOOPER_BUFFER_LEN * m_samplerate * sizeof(jack_default_audio_sample_t));
                    memset(m_loops[cmd.loopIdx].buffer[1], 0, MAX_LOOPER_BUFFER_LEN * m_samplerate * sizeof(jack_default_audio_sample_t));
                }
            }
            m_activeLoop = cmd.loopIdx;
            m_state = LS_SHOULD_RECORD;
            return true;
        }
        break;
    case LOOP_STOP:
        if (cmd.loopIdx > m_loops.size())
        {
            return false;
        }
        if (state == LS_RECORD || state == LS_SHOULD_RECORD)
        {
            m_state = LS_SHOULD_STOP_RECORD;
            return true;
        }
        else if (state == LS_PLAY || state == LS_SHOULD_PLAY)
        {
            m_state = LS_SHOULD_STOP_PLAY;
            return true;
        }
        break;
    default:
        break;
    }
    return false;
}

bool mck::Looper::GetRTData(LoopState &r)
{
    if (m_isInitialized == false) {
        return false;
    }

    r.state = m_state.load();
    r.idx = m_activeLoop.load();
    if (m_loops[r.idx].len > 1) {
        r.len = (double) m_loops[r.idx].len / (double) m_samplerate;
        r.pos = (double) m_loops[r.idx].idx / ((double) m_loops[r.idx].len - 1.0);
    } else {
        r.len = 0.0;
        r.pos = 0.0;
    }

    return true;
}
