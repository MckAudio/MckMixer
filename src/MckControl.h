#pragma once

#include <jack/jack.h>
#include <jack/midiport.h>
#include <cmath>
#include <vector>

#include "MckTypes.hpp"
#include "DspHelper.hpp"

namespace mck
{
    class Looper;
    class Transport;

    class Control
    {
    public:
        Control();
        ~Control(){};
        bool ProcessMidi(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged, ControlState &state);
        bool ApplyCommand(ControlCommand &cmd);
        
        bool Process(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged); 
        bool ApplyCommand(ChannelControlCommand &cmd);

        void AddLooper(Looper *looper);
        void SetTransport(Transport *trans);
    private:
        void ApplyDataChanges(void *outBuf, Config &config);
        bool m_isInitialized;
        ControlState m_state;
        std::vector<Looper *> m_looper;
        Transport *m_trans;
    };
}; // namespace mck