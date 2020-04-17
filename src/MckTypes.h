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
        Reverb reverb;
        Delay delay;
        Config() : gain(0.0), gainLin(1.0), targetLeft(), targetRight(), channels(), channelCount(0), reverb(), delay() {};
    };
    void to_json(nlohmann::json &j, const Config &c);
    void from_json(const nlohmann::json &j, Config &c);
};