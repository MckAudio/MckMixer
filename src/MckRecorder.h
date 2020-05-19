#include <sndfile.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#include <string>
#include <atomic>
#include <thread>
#include <mutex>
#include <condition_variable>

#include "MckTypes.h"

namespace mck {
    #define RECORDER_BUFFER_LEN_S 5

    class Recorder {
        public:
        Recorder();
        ~Recorder();
        bool Init(unsigned sampleRate, unsigned bufferSize);
        bool Start(std::string filePath);
        bool Stop();
        bool ProcessAudio(float *inputLeft, float *inputRight, unsigned nframes);
        bool GetState(mck::Recording &r);

        private:

        void WriterThread();

        // General Settings
        bool m_isInitialized;
        unsigned m_bufferSize;
        unsigned m_sampleRate;

        // Recording Buffers
        char m_activeBuffer;
        float *m_buffer[2];
        unsigned m_activeSamples[2];
        unsigned m_bufferLen;
        unsigned m_nBuffers;
        std::atomic<long> m_recordedBuffers;

        // Output File
        unsigned m_totalLen;
        std::string m_filePath;
        SNDFILE *m_sndFile;

        // Synchronization
        std::atomic<bool> m_isRecording;
        std::atomic<bool> m_isWriting;
        std::atomic<bool> m_isClosing;
        std::thread *m_writerThread;
        std::condition_variable m_writerCond;
        std::condition_variable m_stopCond;
    };
}