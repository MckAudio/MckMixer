#pragma once

#include <jack/jack.h>
#include <jack/midiport.h>
#include <cmath>

#include "MckTypes.hpp"
#include "DspHelper.hpp"

namespace mck
{
    class Control
    {
    public:
        Control();
        ~Control(){};
        bool ProcessMidi(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged, ControlState &state);
        bool ApplyCommand(ControlCommand &cmd);
        
        bool Process(jack_port_t *inPort, jack_port_t *outPort, jack_nframes_t nframes, Config &config, bool &configChanged); 
        bool ApplyCommand(ChannelControlCommand &cmd);
    private:
        void ApplyDataChanges(void *outBuf, Config &config);
        bool m_isInitialized;
        ControlState m_state;
    };
}; // namespace mck