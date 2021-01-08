#pragma once

#include <Transport.hpp>
#include "MckTypes.h"
#include <vector>
#include <atomic>
#include <cstring>

namespace mck
{
    #define MAX_LOOPER_BUFFER_LEN 60
    #define MAX_NUM_LOOPS 8

struct LoopDsp
{
    bool isStereo;
    jack_default_audio_sample_t *buffer[2];
    unsigned len;
    unsigned idx;
    LoopDsp() : isStereo(false), idx(0), len(0) {}
};
struct LoopRec
{
    bool isStereo;
    bool isRecording;
    bool shouldRecord;
    unsigned numBars;
    unsigned loopIdx;
    LoopRec() : isRecording(false), shouldRecord(), numBars(0), loopIdx(0) {}
};

class Looper
{
public:
    Looper();
    ~Looper();
    void Init(unsigned samplerate, unsigned buffersize, Transport *trans);

    bool ProcessMono(jack_default_audio_sample_t *inOut, TransportState &ts);
    bool ProcessStereo(jack_default_audio_sample_t *inOutL, jack_default_audio_sample_t *inOutR, TransportState &ts);

    bool ApplyCommand(LoopCommand &cmd, bool isStereo);

    bool GetRTData(LoopState &r);

private:
    bool m_isInitialized;

    unsigned m_buffersize;
    unsigned m_samplerate;


    mck::Transport *m_trans;
    jack_default_audio_sample_t *m_buffer;
    std::vector<LoopDsp> m_loops;

    std::atomic<char> m_state;
    std::atomic<char> m_activeLoop;
};
}; // namespace mck