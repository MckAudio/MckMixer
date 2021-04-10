#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <pwd.h>

// Web
#include <filesystem>
#include <sstream>
#include <fstream>
#include <string>
#include <string.h>

// Types
#include <nlohmann/json.hpp>
#include "MckTypes.h"

// Gui
#include <GuiWindow.hpp>

// Dsp Modules
#include "MckMixer.h"

// Threading
#include <thread>
#include <atomic>
#include <time.h>

namespace fs = std::filesystem;
using namespace nlohmann;

struct PerSocketData
{
    std::string id;
    float rand;
};

mck::GuiWindow m_gui;
mck::Mixer m_mixer;

std::atomic<bool> m_isClosing = false;
std::thread *m_rtThread;
mck::RealTimeData m_rtData;

void CloseApplication()
{
    m_isClosing = true;
    m_mixer.Close();
    m_gui.Close();
    exit(0);
}

static void SignalHandler(int sig)
{
    fprintf(stdout, "Signal %d received, exiting...\n", sig);
    CloseApplication();
}

int main(int argc, char **argv)
{
    struct passwd *pw = getpwuid(getuid());
    fs::path configPath(pw->pw_dir);
    configPath.append(".mck").append("mixer");
    if (fs::exists(configPath) == false)
    {
        fs::create_directories(configPath);
    }
    configPath.append("config.json");

    if (m_mixer.Init(configPath.string()) == false)
    {
        return EXIT_FAILURE;
    }

    m_mixer.SetGuiPtr(&m_gui);
    m_gui.SetBasePtr((mck::GuiBase *) &m_mixer);

    signal(SIGQUIT, SignalHandler);
    signal(SIGTERM, SignalHandler);
    signal(SIGHUP, SignalHandler);
    signal(SIGINT, SignalHandler);

    
    #ifdef DEBUG
        std::printf("[DEBUG MODE]\n");
        m_gui.Show("MckMixer", "./www", 9002);
    #else
        m_gui.Show("MckMixer", "/usr/share/mck-mixer/gui", 9001);
    #endif

    CloseApplication();

    return 0;
}