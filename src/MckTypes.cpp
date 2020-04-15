#include "MckTypes.h"

// MESSAGE
void mck::to_json(nlohmann::json &j, const Message &m)
{
    j["section"] = m.section;
    j["msgType"] = m.msgType;
    j["data"] = m.data;
}
void mck::from_json(const nlohmann::json &j, Message &m)
{
    m.section = j.at("section").get<std::string>();
    m.msgType = j.at("msgType").get<std::string>();
    m.data = j.at("data").get<std::string>();
}

// CHANNEL COMMAND
void mck::to_json(nlohmann::json &j, const ChannelCommand &c)
{
    j["command"] = c.command;
    j["isStereo"] = c.isStereo;
    j["idx"] = c.idx;
}
void mck::from_json(const nlohmann::json &j, ChannelCommand &c)
{
    c.command = j.at("command").get<std::string>();
    c.isStereo = j.at("isStereo").get<bool>();
    c.idx = j.at("idx").get<unsigned>();
}

// CHANNEL
void mck::to_json(nlohmann::json &j, const Channel &c)
{
    j["name"] = c.name;
    j["isStereo"] = c.isStereo;
    j["gain"] = c.gain;
    j["pan"] = c.pan;
    j["send"] = c.send;
    j["sourceLeft"] = c.sourceLeft;
    j["sourceRight"] = c.sourceRight;
}
void mck::from_json(const nlohmann::json &j, Channel &c)
{
    c.name = j.at("name").get<std::string>();
    c.isStereo = j.at("isStereo").get<bool>();
    c.gain = j.at("gain").get<double>();
    c.pan = j.at("pan").get<double>();
    c.send = j.at("send").get<double>();
    c.sourceLeft = j.at("sourceLeft").get<std::string>();
    c.sourceRight = j.at("sourceRight").get<std::string>();
}

// REVERB
void mck::to_json(nlohmann::json &j, const mck::Reverb &r) {
    j["rt60"] = r.rt60;
    j["gain"] = r.gain;
    j["type"] = r.type;
}
void mck::from_json(const nlohmann::json &j, mck::Reverb &r) {
    r.rt60 = j.at("rt60").get<double>();
    r.gain = j.at("gain").get<double>();
    r.type = j.at("type").get<unsigned>();
}

// CONFIG
void mck::to_json(nlohmann::json &j, const Config &c)
{
    j["channels"] = c.channels;
    j["channelCount"] = c.channelCount;
    j["gain"] = c.gain;
    j["targetLeft"] = c.targetLeft;
    j["targetRight"] = c.targetRight;
    j["reverb"] = c.reverb;
}
void mck::from_json(const nlohmann::json &j, Config &c)
{
    c.channels = j.at("channels").get<std::vector<Channel>>();
    c.channelCount = j.at("channelCount").get<unsigned>();
    c.gain = j.at("gain").get<double>();
    c.targetLeft = j.at("targetLeft").get<std::vector<std::string>>();
    c.targetRight = j.at("targetRight").get<std::vector<std::string>>();
    c.reverb = j.at("reverb").get<Reverb>();
}