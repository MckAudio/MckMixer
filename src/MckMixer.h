#pragma once

#include "MckTypes.h"
#include "MckDelay.h"
#include "MckRecorder.h"
#include "DspHelper.h"
#include "JackHelper.h"
#include "Metronome.h"
#include "MckLooper.h"
#include "MckTransport.h"

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
#include <ctime>

// Threading
#include <atomic>
#include <thread>
#include <condition_variable>

namespace fs = std::filesystem;
using namespace nlohmann;

namespace mck
{

#define MCK_MIXER_MAX_INPUTS 32

enum ReverbType
{
    REV_STREV = 0,
    REV_PROG,
    REV_ZREV,
    REV_NREV,
    REV_LENGTH
};

enum ProcessingPhase
{
    PROC_FADE_IN = 0,
    PROC_NORMAL,
    PROC_UPDATING,
    PROC_FADE_OUT,
    PROC_BYPASS,
    PROC_CLOSING,
    PROC_CLOSED
};

struct InputDsp
{
    jack_port_t *port[2];
    jack_default_audio_sample_t *buffer[2];
    double meter[2];
    double meterLin[2];
    bool isStereo;
    Looper looper;
    InputDsp() : isStereo() {}
};

class Mixer
{
public:
    Mixer();
    bool Init(std::string path);
    void Close();

    bool SetConfig(mck::Config &config);
    bool GetConfig(mck::Config &config);
    jack_client_t *GetClient() { return m_client; };

    // Channel Commands
    bool AddChannel(bool isStereo, mck::Config &outConfig);
    bool RemoveChannel(unsigned idx, mck::Config &outConfig);

    // Commands
    bool ApplyCommand(mck::ConnectionCommand cmd, mck::Config &outConfig);
    bool ApplyCommand(mck::LoopCommand &cmd);
    bool ApplyCommand(mck::TransportCommand &cmd);

    void ProcessAudio(jack_nframes_t nframes);

    void StartRecording();
    void StopRecording();

    void GetRealTimeData(mck::RealTimeData &r);

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
    std::atomic<bool> m_updateCount;
    std::atomic<bool> m_isProcessing;
    std::atomic<char> m_phase; // One of enum processing phase

    double m_meterCoeff;

    // JACK
    jack_client_t *m_client;
    jack_port_t *m_audioOut[2];
    //jack_port_t **m_audioIn;
    // MIDI
    jack_port_t *m_midiClkIn;
    jack_port_t *m_midiClkOut;
    jack_port_t *m_midiCtrlIn;

    // DSP
    double *m_interpolSqrt;
    double *m_interpolLin;
    //jack_default_audio_sample_t **m_bufferIn;
    jack_default_audio_sample_t *m_bufferOut[2];
    jack_default_audio_sample_t *m_reverbBuffer[2];
    jack_default_audio_sample_t *m_delayBuffer[2];
    double m_meterOutLin[2];
    double m_meterOut[2];
    InputDsp *m_inputDsp;

    fv3::revbase_f **m_reverb;
    mck::DelayDsp m_delay;
    mck::Recorder m_recorder;
    mck::Metronome m_metro;
    mck::Transport m_trans;

    // Threading
    std::mutex m_updateMutex;
    std::condition_variable m_updateCond;
    std::atomic<bool> m_updateReady;

    void ProcessReverb(jack_nframes_t nframes, float rt60, unsigned type);
    void ProcessDelay(jack_nframes_t nframes, double delay, double feedback);
    bool InitConfig(mck::Config &config);
    bool LoadConfig(mck::Config &config, std::string path);
    bool SaveConfig(mck::Config &config, std::string path);
};
} // namespace mck