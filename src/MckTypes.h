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
        std::string source;
        std::string sourceStereo;
        double gain;
        double gainLin;
        double pan;
        double send;
        double sendLin;
        Channel() : name(""), isStereo(false), gain(-200.0), gainLin(0.0), pan(50.0), send(-200.0), sendLin(0.0), source(""), sourceStereo("") {
        }
    };
    void to_json(nlohmann::json &j, const Channel &c);
    void from_json(const nlohmann::json &j, Channel &c);

    struct Reverb {
        double rt60;
        double gain;
        double gainLin;
        Reverb() : rt60(2.0), gain(0.0), gainLin(1.0) {}
    };
    void to_json(nlohmann::json &j, const Reverb &r);
    void from_json(const nlohmann::json &j, Reverb &r);

    struct Config {
        double gain;
        double gainLin;
        std::vector<Channel> channels;
        unsigned channelCount;
        Reverb reverb;
        Config() : channels(), channelCount(0), gain(0.0), gainLin(1.0), reverb() {};
    };
    void to_json(nlohmann::json &j, const Config &c);
    void from_json(const nlohmann::json &j, Config &c);
};