#include "MckDelay.h"

mck::DelayDsp::DelayDsp() : m_isInitialized(false), m_bufferLen(0), m_writePtr(0), m_readPtr(0), m_sampleRate(0), m_bufferSize(0), m_delaySamps(0), m_delaySecs(0), m_delaySecsMin(0), m_delaySecsMax(0), m_feedbackDb(0), m_feedbackLin(0) {}

mck::DelayDsp::~DelayDsp()
{
    if (m_isInitialized)
    {
        free(m_buffer[0]);
        free(m_buffer[1]);
        free(m_tmp[0]);
        free(m_tmp[1]);
    }
}

bool mck::DelayDsp::Init(unsigned sampleRate, unsigned bufferSize)
{
    if (m_isInitialized) {
        return false;
    }
    m_sampleRate = sampleRate;
    m_bufferSize = bufferSize;
    m_bufferLen = m_bufferSize * ((unsigned)std::ceil(MAX_DELAY_TIME * (double)m_sampleRate / (double)m_bufferSize));

    m_buffer[0] = (float *)malloc(m_bufferLen * sizeof(float));
    m_buffer[1] = (float *)malloc(m_bufferLen * sizeof(float));
    memset(m_buffer[0], 0, m_bufferLen * sizeof(float));
    memset(m_buffer[1], 0, m_bufferLen * sizeof(float));

    m_tmp[0] = (float *)malloc(m_bufferSize * sizeof(float));
    m_tmp[1] = (float *)malloc(m_bufferSize * sizeof(float));
    memset(m_tmp[0], 0, m_bufferSize * sizeof(float));
    memset(m_tmp[1], 0, m_bufferSize * sizeof(float));

    m_delaySecsMin = (double)m_bufferSize / (double)m_sampleRate;
    m_delaySecsMax = (double)(m_bufferLen - m_bufferSize) / (double)m_sampleRate;

    m_isInitialized = true;
    return true;
}

void mck::DelayDsp::SetDelayTime(double &delaySecs)
{
    delaySecs = std::max(m_delaySecsMin, std::min(m_delaySecsMax, delaySecs));
    m_delaySecs = delaySecs;
    m_delaySamps = std::round(delaySecs * (double)m_sampleRate);

    return;
}

void mck::DelayDsp::SetFeedback(double &feedback)
{
    feedback = std::max(-200.0, std::min(-3.0, feedback));
    m_feedbackDb = feedback;
    m_feedbackLin = mck::DbToLin(feedback);

    return;
}

void mck::DelayDsp::ProcessAudio(float *inL, float *inR, float *outL, float *outR) {
    if (m_isInitialized == false) {
        return;
    }

    m_readPtr = (m_bufferLen + m_writePtr - m_delaySamps) % m_bufferLen;

    // First read output samples
    unsigned samplesLeft = std::min(m_bufferSize, m_bufferLen - m_readPtr);
    memcpy(outL, m_buffer[0] + m_readPtr, samplesLeft * sizeof(float));
    memcpy(outR, m_buffer[1] + m_readPtr, samplesLeft * sizeof(float));
    if (samplesLeft < m_bufferSize) {
        memcpy(outL + samplesLeft, m_buffer[0], m_bufferSize - samplesLeft);
        memcpy(outR + samplesLeft, m_buffer[1], m_bufferSize - samplesLeft);
    }

    // Write input samples
    if (m_feedbackLin == 0.0) {
        memcpy(m_buffer[0] + m_writePtr, inL, m_bufferSize * sizeof(float));
        memcpy(m_buffer[1] + m_writePtr, inR, m_bufferSize * sizeof(float));
    } else {
        for (unsigned i = 0; i < m_bufferSize; i++)
        {
            m_buffer[0][m_writePtr + i] = inL[i] + m_feedbackLin * outL[i];
            m_buffer[1][m_writePtr + i] = inR[i] + m_feedbackLin * outR[i];
        }
    }

    m_writePtr = (m_writePtr + m_bufferSize) % m_bufferLen;
}

void mck::DelayDsp::ProcessAudio(float *inOutL, float *inOutR)
{
    memcpy(m_tmp[0], inOutL, m_bufferSize * sizeof(float));
    memcpy(m_tmp[1], inOutR, m_bufferSize * sizeof(float));

    ProcessAudio(m_tmp[0], m_tmp[1], inOutL, inOutR);
}