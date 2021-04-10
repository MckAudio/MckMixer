#pragma once

#include <nlohmann/json.hpp>
#include <Transport.hpp>
#include <vector>
#include <string>

namespace mck
{
    struct ChannelCommand
    {
        bool isStereo;
        std::string command;
        unsigned idx;
        ChannelCommand() : isStereo(false), command(""), idx(0) {}
    };
    void to_json(nlohmann::json &j, const ChannelCommand &c);
    void from_json(const nlohmann::json &j, ChannelCommand &c);

    struct ConnectionCommand
    {
        bool isInput;
        unsigned idx;
        unsigned subIdx;
        std::string command;
        std::string target;
        ConnectionCommand() : isInput(true), command(""), idx(0), subIdx(0), target("") {}
    };
    void to_json(nlohmann::json &j, const ConnectionCommand &c);
    void from_json(const nlohmann::json &j, ConnectionCommand &c);

    struct Recording
    {
        bool isActive;
        std::string recTime;
        unsigned recHours;
        unsigned recMins;
        unsigned recSecs;
        unsigned recMiSecs;
        Recording() : isActive(), recTime(""), recHours(0), recMins(0), recSecs(0), recMiSecs(0) {}
    };
    void to_json(nlohmann::json &j, const Recording &r);
    void from_json(const nlohmann::json &j, Recording &r);

    struct MeterItem
    {
        double l;
        double r;
        MeterItem() : l(0.0), r(0.0) {}
    };
    void to_json(nlohmann::json &j, const MeterItem &m);
    void from_json(const nlohmann::json &j, MeterItem &m);

    struct TempoData
    {
        double bpm;
        bool sync;
        unsigned bar;
        unsigned beat;
        TempoData() : bpm(0.0), sync(false), bar(0), beat(0) {}
    };
    void to_json(nlohmann::json &j, const TempoData &t);
    void from_json(const nlohmann::json &j, TempoData &t);

    struct Loop
    {
        std::string name;
        bool isRecorded;
        bool isStereo;
        unsigned numBars;
        Loop() : name(""), isRecorded(false), isStereo(false), numBars(0) {}
    };
    void to_json(nlohmann::json &j, const Loop &l);
    void from_json(const nlohmann::json &j, Loop &l);

    enum LoopModeEnum
    {
        LOOP_NOTHING = 0,
        LOOP_PLAY,
        LOOP_RECORD,
        LOOP_STOP,
        LOOP_DELETE,
        LOOP_COUNT
    };
    enum LoopStateEnum
    {
        LS_IDLE,
        LS_SHOULD_PLAY,
        LS_PLAY,
        LS_SHOULD_RECORD,
        LS_RECORD,
        LS_SHOULD_STOP_RECORD,
        LS_SHOULD_STOP_PLAY,
        LS_STOP
    };

    struct LoopCommand
    {
        unsigned chanIdx;
        unsigned loopIdx;
        char mode; // 0 - NOTHING, 1 - PLAY, 2 - RECORD, 3 - STOP, 4 - DELETE
        LoopCommand() : chanIdx(0), loopIdx(0), mode(LOOP_NOTHING) {}
    };
    void to_json(nlohmann::json &j, const LoopCommand &l);
    void from_json(const nlohmann::json &j, LoopCommand &l);

    struct LoopState
    {
        char state;
        double pos;
        double len;
        unsigned idx;

        LoopState() : state(LS_IDLE), pos(0.0), len(0.0), idx(0) {}
    };
    void to_json(nlohmann::json &j, const LoopState &l);
    void from_json(const nlohmann::json &j, LoopState &l);

    //>> CONTROL   //

    enum ControlCommandEnum
    {
        CC_NOTHING,
        CC_LEARN,
        CC_CLEAR,
        CC_LENGTH
    };
    enum ControlTypeEnum
    {
        CT_NOTHING,
        CT_MASTER,
        CT_MODE,
        CT_ROTARY,
        CT_PUSH,
        CT_LENGTH
    };
    enum ControlStateEnum
    {
        CS_IDLE,
        CS_LEARNING,
        CS_LENGTH
    };
    enum ControlModeEnum
    {
        CM_CHANNEL,
        CM_GAIN,
        CM_PAN,
        CM_REVERB,
        CM_DELAY,
        CM_LENGTH
    };

    struct ControlCommand
    {
        char cmd;
        char type;
        unsigned idx;
        ControlCommand() : cmd(CC_NOTHING), type(CT_NOTHING), idx(0) {}
    };
    void to_json(nlohmann::json &j, const ControlCommand &c);
    void from_json(const nlohmann::json &j, ControlCommand &c);

    struct ControlState
    {
        char state;
        char type;
        unsigned idx;
        ControlState() : state(CS_IDLE), type(CT_NOTHING), idx(0) {}
    };
    void to_json(nlohmann::json &j, const ControlState &c);
    void from_json(const nlohmann::json &j, ControlState &c);

    struct MidiControl
    {
        bool set;
        // RAW
        unsigned char head;
        unsigned char data;
        // INTERMEDIATE
        unsigned char chan;
        unsigned char type;
        MidiControl() : set(false), head(0), data(0), chan(0), type(0) {}
    };
    void to_json(nlohmann::json &j, const MidiControl &m);
    void from_json(const nlohmann::json &j, MidiControl &m);

    struct ComboControl
    {
        MidiControl rotary;
        MidiControl push;
        ComboControl() : rotary(), push() {}
    };
    void to_json(nlohmann::json &j, const ComboControl &c);
    void from_json(const nlohmann::json &j, ComboControl &c);

    struct Controls
    {
        unsigned activeMode;
        unsigned activeChannel;
        unsigned numCombo;
        unsigned numMaster;
        unsigned numMode;
        std::vector<ComboControl> combo;
        std::vector<MidiControl> master; // gain, stop, start, continue, prevChannel, nextChannel
        std::vector<MidiControl> mode;   // channel, gainMute, pan, reverb, delay
        Controls() : activeMode(CM_GAIN), activeChannel(0), numCombo(0), numMaster(0), numMode(0) {}
    };
    void to_json(nlohmann::json &j, const Controls &c);
    void from_json(const nlohmann::json &j, Controls &c);

    //   CONTROL <<//

    struct RealTimeData
    {
        ControlState control;
        TransportState trans;
        TempoData tempo;
        Recording rec;
        std::vector<MeterItem> meterIn;
        MeterItem meterOut;
        std::vector<LoopState> looper;
        RealTimeData() : control(), trans(), tempo(), rec(), meterIn(), meterOut(), looper() {}
    };
    void to_json(nlohmann::json &j, const RealTimeData &r);
    void from_json(const nlohmann::json &j, RealTimeData &r);

    struct Channel
    {
        std::string name;
        bool isStereo;
        std::string sourceLeft;
        std::string sourceRight;
        bool mute;
        bool solo;
        double inputGain;
        double inputGainLin;
        double loopGain;
        double loopGainLin;
        double gain;
        double gainLin;
        double pan;
        double sendReverb;
        double sendReverbLin;
        double sendDelay;
        double sendDelayLin;
        std::vector<Loop> loops;
        unsigned numLoops;
        Channel()
            : name(""),
              isStereo(false),
              mute(false),
              solo(false),
              inputGain(0.0),
              inputGainLin(1.0),
              loopGain(0.0),
              loopGainLin(1.0),
              gain(-200.0),
              gainLin(0.0),
              pan(50.0),
              sendReverb(-200.0),
              sendReverbLin(0.0),
              sendDelay(-200.0),
              sendDelayLin(0.0),
              sourceLeft(""),
              sourceRight(""),
              numLoops(0)
        {
        }
    };
    void to_json(nlohmann::json &j, const Channel &c);
    void from_json(const nlohmann::json &j, Channel &c);

    struct PlayerChannel
    {
        std::vector<std::string> playlist;
        double gain;
        double gainLin;
        double pan;
        double sendReverb;
        double sendReverbLin;
        double sendDelay;
        double sendDelayLin;
        PlayerChannel() : playlist(), gain(-200.0), gainLin(0.0), pan(50.0), sendReverb(-200.0), sendReverbLin(0.0), sendDelay(-200.0), sendDelayLin(0.0)
        {
        }
    };
    void to_json(nlohmann::json &j, const PlayerChannel &c);
    void from_json(const nlohmann::json &j, PlayerChannel &c);

    struct Reverb
    {
        double rt60;
        double gain;
        double gainLin;
        unsigned type;
        Reverb() : rt60(2.0), gain(0.0), gainLin(1.0), type(0) {}
    };
    void to_json(nlohmann::json &j, const Reverb &r);
    void from_json(const nlohmann::json &j, Reverb &r);

    struct Delay
    {
        double gain;
        double gainLin;
        double delay;    // in Seconds
        double feedback; // in Db
        unsigned type;
        Delay() : gain(0.0), gainLin(1.0), delay(1.0), feedback(-200.0), type(0) {}
    };
    void to_json(nlohmann::json &j, const Delay &d);
    void from_json(const nlohmann::json &j, Delay &d);

    struct Config
    {
        double gain;
        double gainLin;
        std::vector<std::string> clockSource;
        std::vector<std::string> clockTarget;
        std::vector<std::string> controlSource;
        std::vector<std::string> controlTarget;
        std::vector<std::string> targetLeft;
        std::vector<std::string> targetRight;
        std::vector<Channel> channels;
        unsigned channelCount;
        PlayerChannel player;
        Reverb reverb;
        Delay delay;
        Controls controls;
        Config() : gain(0.0), gainLin(1.0), clockSource(), clockTarget(), controlSource(), controlTarget(), targetLeft(), targetRight(), channels(), channelCount(0), player(), reverb(), delay(), controls(){};
    };
    void to_json(nlohmann::json &j, const Config &c);
    void from_json(const nlohmann::json &j, Config &c);
}; // namespace mck