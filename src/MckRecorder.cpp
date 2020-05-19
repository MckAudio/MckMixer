#include "MckRecorder.h"

mck::Recorder::Recorder()
    : m_isInitialized(false), m_isRecording(false), m_isWriting(false), m_bufferSize(0), m_sampleRate(0), m_activeBuffer(0), m_bufferLen(0), m_nBuffers(0), m_totalLen(0), m_filePath(""), m_recordedBuffers(0), m_isClosing(false)
{
    m_activeSamples[0] = 0;
    m_activeSamples[1] = 0;
}

mck::Recorder::~Recorder()
{
    // Free
    if (m_isInitialized)
    {
        if (m_isRecording.load()) {
            Stop();
        }
        m_isClosing = true;
        m_writerCond.notify_all();

        free(m_buffer[0]);
        free(m_buffer[1]);
        m_isInitialized = false;
    }
}

bool mck::Recorder::Init(unsigned sampleRate, unsigned bufferSize)
{
    if (m_isInitialized)
    {
        return false;
    }

    m_bufferSize = bufferSize;
    m_sampleRate = sampleRate;

    // Alloc buffer
    m_nBuffers = (unsigned)std::ceil((double)RECORDER_BUFFER_LEN_S * (double)m_sampleRate / (double)m_bufferSize);
    m_bufferLen = m_nBuffers * m_bufferSize;

    for (unsigned i = 0; i < 2; i++)
    {
        m_buffer[i] = (float *)malloc(2 * m_bufferLen * sizeof(float));
        memset(m_buffer[i], 0, 2 * m_bufferLen * sizeof(float));
    }

    m_writerThread = new std::thread(&mck::Recorder::WriterThread, this);

    m_isInitialized = true;
    return true;
}

bool mck::Recorder::Start(std::string filePath)
{
    if (m_isInitialized == false || m_isRecording.load())
    {
        return false;
    }

    // Reset Counters
    m_activeSamples[0] = 0;
    m_activeSamples[1] = 0;
    m_activeBuffer = 0;
    m_totalLen = 0;
    m_recordedBuffers = 0;


    SF_INFO sndInfo;
    sndInfo.channels = 2;
    sndInfo.samplerate = m_sampleRate;
    sndInfo.format = SF_FORMAT_WAV | SF_FORMAT_FLOAT;
    m_sndFile = sf_open(filePath.c_str(), SFM_WRITE, &sndInfo);

    if (m_sndFile == nullptr)
    {
        return false;
    }

    m_filePath = filePath;
    m_isRecording = true;

    return true;
}

bool mck::Recorder::Stop()
{
    if (m_isInitialized == false || m_isRecording.load() == false) {
        return false;
    }
    std::mutex mu;
    m_isRecording = false;
    // Wait for process end
    std::unique_lock<std::mutex> lck(mu);
    m_stopCond.wait(lck);

    m_activeBuffer = 1 - m_activeBuffer;
    m_isWriting = true;
    m_writerCond.notify_one();

    m_writerCond.wait(lck);

    // Write File
    sf_close(m_sndFile);
    return true;
}

bool mck::Recorder::ProcessAudio(float *inputLeft, float *inputRight, unsigned nframes)
{
    if (m_isInitialized == false) {
        return false;
    }

    if (m_isRecording.load()) {
        unsigned offset = 2 * m_activeSamples[m_activeBuffer];

        // Interleave audio
        for (unsigned i = 0; i < m_bufferSize; i++)
        {
            m_buffer[m_activeBuffer][offset + 2*i] = inputLeft[i];
            m_buffer[m_activeBuffer][offset + 2*i + 1] = inputRight[i];
        }

        m_activeSamples[m_activeBuffer] += m_bufferSize;

        m_recordedBuffers.fetch_add(1);

        if (m_activeSamples[m_activeBuffer] >= m_bufferLen)
        {
            m_activeBuffer = 1 - m_activeBuffer;

            // Signal file writer to write file
            m_isWriting = true;
            m_writerCond.notify_one();
        }
    }

    m_stopCond.notify_one();
    return true;
}

bool mck::Recorder::GetState(mck::Recording &r)
{
    if (m_isInitialized == false) {
        return false;
    }

    r.isActive = m_isRecording.load();
    if (r.isActive) {
        long m_nBuffers = m_recordedBuffers.load();
        long ms = (long)std::round((double)m_nBuffers * (double)m_bufferSize / (double)m_sampleRate * 1000.0);
        r.recMiSecs = ms % 1000;
        r.recSecs = (ms / 1000) % 60;
        r.recMins = (ms / (1000 * 60)) % 60;
        r.recHours = (ms / (1000 * 60 * 60));
        /*
       long secs = m_nBuffers * m_bufferSize / m_sampleRate;
       r.recSecs = secs % 60;
       r.recMins = (secs / 60) % 60;
       r.recHours = (secs / (60 & 60));
       */
    }

    return true;
}

void mck::Recorder::WriterThread() {
    std::mutex mu;

    while(true) {
        std::unique_lock<std::mutex> lck(mu);
        while(true) {
            if (m_isClosing.load()) {
                return;
            }
            if (m_isWriting.load()) {
                break;
            }
            m_writerCond.wait(lck);
        }
        char idx = 1 - m_activeBuffer;

        // Push Samples in sndfile
        sf_writef_float(m_sndFile, m_buffer[idx], m_activeSamples[idx]);

        // Reset
        m_activeSamples[idx] = 0;
        m_isWriting = false;

        m_writerCond.notify_one();
    }
}