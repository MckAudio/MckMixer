#pragma once

#include "nlohmann/json.hpp"
#include <vector>
#include <string>

namespace mck {
    struct Message {
        std::string section;
        unsigned idx;
        std::string msgType;
        std::string data;
        Message() : section(""), idx(0), msgType(""), data("") {}
        Message(std::string _section, std::string _msgType) : section(_section), msgType(_msgType), idx(0), data("") {}
    };
    void to_json(nlohmann::json &j, const Message &m);
    void from_json(const nlohmann::json &j, Message &m);

    struct ChannelCommand {
        bool isStereo;
        std::string command;
        unsigned idx;
        ChannelCommand() : isStereo(false), command(""), idx(0) {}
    };
    void to_json(nlohmann::json &j, const ChannelCommand &c);
    void from_json(const nlohmann::json &j, ChannelCommand &c);

    struct ConnectionCommand {
        bool isInput;
        unsigned idx;
        unsigned subIdx;
        std::string command;
        std::string target;
        ConnectionCommand() : isInput(true), command(""), idx(0), subIdx(0), target("") {}
    };
    void to_json(nlohmann::json &j, const ConnectionCommand &c);
    void from_json(const nlohmann::json &j, ConnectionCommand &c);

    struct Recording {
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

    struct MeterItem {
        double l;
        double r;
        MeterItem() : l(0.0), r(0.0) {} 
    };
    void to_json(nlohmann::json &j, const MeterItem &m);
    void from_json(const nlohmann::json &j, MeterItem &m);

    struct RealTimeData {
        Recording rec;
        std::vector<MeterItem> meterIn;
        MeterItem meterOut;
        RealTimeData() : rec(), meterIn(), meterOut() {}
    };
    void to_json(nlohmann::json &j, const RealTimeData &r);
    void from_json(const nlohmann::json &j, RealTimeData &r);

    struct Channel {
        std::string name;
        bool isStereo;
        std::string sourceLeft;
        std::string sourceRight;
        double gain;
        double gainLin;
        double pan;
        double sendReverb;
        double sendReverbLin;
        double sendDelay;
        double sendDelayLin;
        Channel() : name(""), isStereo(false), gain(-200.0), gainLin(0.0), pan(50.0), sendReverb(-200.0), sendReverbLin(0.0), sendDelay(-200.0), sendDelayLin(0.0), sourceLeft(""), sourceRight("") {
        }
    };
    void to_json(nlohmann::json &j, const Channel &c);
    void from_json(const nlohmann::json &j, Channel &c);

    struct PlayerChannel {
        std::vector<std::string> playlist;
        double gain;
        double gainLin;
        double pan;
        double sendReverb;
        double sendReverbLin;
        double sendDelay;
        double sendDelayLin;
        PlayerChannel() : playlist(), gain(-200.0), gainLin(0.0), pan(50.0), sendReverb(-200.0), sendReverbLin(0.0), sendDelay(-200.0), sendDelayLin(0.0) {
        }
    };
    void to_json(nlohmann::json &j, const PlayerChannel &c);
    void from_json(const nlohmann::json &j, PlayerChannel &c);

    struct Reverb {
        double rt60;
        double gain;
        double gainLin;
        unsigned type;
        Reverb() : rt60(2.0), gain(0.0), gainLin(1.0), type(0) {}
    };
    void to_json(nlohmann::json &j, const Reverb &r);
    void from_json(const nlohmann::json &j, Reverb &r);

    struct Delay {
        double gain;
        double gainLin;
        double delay;       // in Seconds
        double feedback;    // in Db
        unsigned type;
        Delay() : gain(0.0), gainLin(1.0), delay(1.0), feedback(-200.0), type(0) {}
    };
    void to_json(nlohmann::json &j, const Delay &d);
    void from_json(const nlohmann::json &j, Delay &d);


    struct Config {
        double gain;
        double gainLin;
        std::vector<std::string> targetLeft;
        std::vector<std::string> targetRight;
        std::vector<Channel> channels;
        unsigned channelCount;
        PlayerChannel player;
        Reverb reverb;
        Delay delay;
        Config() : gain(0.0), gainLin(1.0), targetLeft(), targetRight(), channels(), channelCount(0), player(), reverb(), delay() {};
    };
    void to_json(nlohmann::json &j, const Config &c);
    void from_json(const nlohmann::json &j, Config &c);
};