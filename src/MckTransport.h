#pragma once

#include <jack/jack.h>
#include <jack/midiport.h>
#include <atomic>
#include "MckTypes.h"

namespace mck
{
class Transport
{
public:
    struct Data {
        double bpm;
        unsigned pulse;
        unsigned pulseLen;
        unsigned beat;
        Data() : bpm(0.0), pulse(0), pulseLen(0), beat(0) {}
    };

    struct Beat {
        char num;
        char off;
        Beat() : num(0), off(0) {}
    };

    Transport();
    ~Transport() {};
    bool Init(unsigned samplerate, unsigned buffersize, double tempo);
    void Process(jack_port_t *port, jack_nframes_t nframes, TransportState &ts);

    bool ApplyCommand(TransportCommand &cmd);
    bool GetRTData(TransportState &rt);
    bool GetBeat(Beat &b);
private:
    void CalcData(double tempo);

    bool m_isInitialized;
    unsigned m_buffersize;
    unsigned m_samplerate;

    std::atomic<char> m_idx;
    std::atomic<bool> m_update;
    Data m_data[2];

    unsigned m_lastPulse;
    unsigned m_beat;        // 0 -> m_beatsPerBar - 1
    int m_beatOffset;       // Samples from last, to next beat
    unsigned m_pulse;       // 0 -> m_numPulses - 1
    const unsigned m_numPulses;   // 24 pulses per beat
    const unsigned m_beatsPerBar; // 3, 4 (default)
    std::atomic<unsigned> m_pulseLen;    // samples per pulse
    std::atomic<double> m_tempo;
    std::atomic<unsigned> m_bar;
    std::atomic<char> m_state;
    std::atomic<char> m_cmd;
    //double m_bpm;

    unsigned m_nextPulse;   // Samples till next pulse
};
}; // namespace mck