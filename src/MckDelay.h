#pragma once

#include <vector>

#include "MckTypes.h"
#include "DspHelper.h"

namespace mck
{
static const double MAX_DELAY_TIME = 5.0;

class DelayDsp
{
public:
    DelayDsp();
    ~DelayDsp();
    bool Init(unsigned sampleRate, unsigned bufferSize);
    
    double GetDelayTime() { return m_delaySecs; };
    void SetDelayTime(double &delaySecs);
    double GetFeedback() { return m_feedbackDb; };
    void SetFeedback(double &feedback);
    
    void ProcessAudio(float *inL, float *inR, float *outL, float *outR);
    void ProcessAudio(float *inOutL, float *inOutR);

private:
    bool m_isInitialized;
    float *m_buffer[2];
    float *m_tmp[2];
    unsigned m_bufferLen;
    unsigned m_writePtr;
    unsigned m_readPtr;
    unsigned m_sampleRate;
    unsigned m_bufferSize;
    unsigned m_delaySamps;
    double m_delaySecs;
    double m_delaySecsMin;
    double m_delaySecsMax;
    double m_feedbackDb;
    double m_feedbackLin;
};
} // namespace mck