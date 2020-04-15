#pragma once

#include "MckTypes.h"
#include "JackHelper.h"

// Audio
#include <freeverb/strev.hpp>
#include <freeverb/progenitor2.hpp>
#include <freeverb/zrev2.hpp>
#include <freeverb/nrevb.hpp>
#include <jack/jack.h>

#include <nlohmann/json.hpp>

#include <filesystem>
#include <fstream>
#include <string>
#include <stdio.h>
#include <atomic>

namespace fs = std::filesystem;
using namespace nlohmann;

namespace mck
{

    #define MCK_MIXER_MAX_INPUTS 32

    enum ReverbType {
        REV_STREV = 0,
        REV_PROG,
        REV_ZREV,
        REV_NREV,
        REV_LENGTH
    };

class Mixer
{
public:
    Mixer();
    bool Init(std::string path);
    void Close();

    bool SetConfig(mck::Config &config);
    bool GetConfig(mck::Config &config);

    bool AddChannel(bool isStereo, mck::Config &outConfig);
    bool RemoveChannel(unsigned idx, mck::Config &outConfig);

    void ProcessAudio(jack_nframes_t nframes);

private:
    bool m_isInitialized;
    jack_nframes_t m_bufferSize;
    jack_nframes_t m_sampleRate;
    mck::Config m_config[2];
    fs::path m_path;

    char m_activeConfig;
    char m_newConfig;
    unsigned m_nInputChans[2];
    std::atomic<bool> m_updateValues;
    bool m_updateCount;


    // JACK
    jack_client_t *m_client;
    jack_port_t *m_audioOut[2];
    jack_port_t **m_audioIn;

    // DSP
    double *m_interpolSqrt;
    double *m_interpolLin;
    jack_default_audio_sample_t **m_bufferIn;
    jack_default_audio_sample_t *m_bufferOut[2];
    jack_default_audio_sample_t *m_reverbBuffer[2];
    jack_default_audio_sample_t *m_delayBuffer[2];

    fv3::revbase_f **m_reverb;

    void ProcessReverb(jack_nframes_t nframes, float rt60, unsigned type);

    bool InitConfig(mck::Config &config);
    bool LoadConfig(mck::Config &config, std::string path);
    bool SaveConfig(mck::Config &config, std::string path);
};
} // namespace mck