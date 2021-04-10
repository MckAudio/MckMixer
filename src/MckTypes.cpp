#include "MckTypes.h"

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

// CONNECTION COMMAND
void mck::to_json(nlohmann::json &j, const ConnectionCommand &c)
{
    j["isInput"] = c.isInput;
    j["idx"] = c.idx;
    j["subIdx"] = c.subIdx;
    j["command"] = c.command;
    j["target"] = c.target;
}
void mck::from_json(const nlohmann::json &j, ConnectionCommand &c)
{
    c.isInput = j.at("isInput").get<bool>();
    c.idx = j.at("idx").get<unsigned>();
    c.subIdx = j.at("subIdx").get<unsigned>();
    c.command = j.at("command").get<std::string>();
    c.target = j.at("target").get<std::string>();
}


// RECORDING
void mck::to_json(nlohmann::json &j, const Recording &r)
{
    j["isActive"] = r.isActive;
    j["recTime"] = r.recTime;
    j["recHours"] = r.recHours;
    j["recMins"] = r.recMins;
    j["recSecs"] = r.recSecs;
    j["recMiSecs"] = r.recMiSecs;
}
void mck::from_json(const nlohmann::json &j, Recording &r)
{
    r.isActive = j.at("isActive").get<bool>();
    r.recTime = j.at("recTime").get<std::string>();
    r.recHours = j.at("recHours").get<unsigned>();
    r.recMins = j.at("recMins").get<unsigned>();
    r.recSecs = j.at("recSecs").get<unsigned>();
    r.recMiSecs = j.at("recMiSecs").get<unsigned>();
}
// METER ITEM
void mck::to_json(nlohmann::json &j, const MeterItem &m)
{
    j["l"] = m.l;
    j["r"] = m.r;
}
void mck::from_json(const nlohmann::json &j, MeterItem &m)
{
    m.l = j.at("l").get<double>();
    m.r = j.at("r").get<double>();
}
// TEMPO
void mck::to_json(nlohmann::json &j, const TempoData &t)
{
    j["bpm"] = t.bpm;
    j["sync"] = t.sync;
    j["bar"] = t.bar;
    j["beat"] = t.beat;
}
void mck::from_json(const nlohmann::json &j, TempoData &t)
{
    t.bpm = j.at("bpm").get<double>();
    t.sync = j.at("sync").get<bool>();
    t.bar = j.at("bar").get<unsigned>();
    t.beat = j.at("beat").get<unsigned>();
}

// LOOP
void mck::to_json(nlohmann::json &j, const Loop &l)
{
    j["name"] = l.name;
    j["isRecorded"] = l.isRecorded;
    j["isStereo"] = l.isStereo;
    j["numBars"] = l.numBars;
}
void mck::from_json(const nlohmann::json &j, Loop &l)
{
    l.name = j.at("name").get<std::string>();
    l.isRecorded = j.at("isRecorded").get<bool>();
    l.isStereo = j.at("isStereo").get<bool>();
    l.numBars = j.at("numBars").get<unsigned>();
}
// LOOP COMMAND
void mck::to_json(nlohmann::json &j, const LoopCommand &l)
{
    j["chanIdx"] = l.chanIdx;
    j["loopIdx"] = l.loopIdx;
    j["mode"] = l.mode;
}
void mck::from_json(const nlohmann::json &j, LoopCommand &l)
{
    l.chanIdx = j.at("chanIdx").get<unsigned>();
    l.loopIdx = j.at("loopIdx").get<unsigned>();
    l.mode = j.at("mode").get<char>();
}
// LOOP STATE
void mck::to_json(nlohmann::json &j, const LoopState &l) {
    j["state"] = l.state;
    j["pos"] = l.pos;
    j["len"] = l.len;
    j["idx"] = l.idx;
}
void mck::from_json(const nlohmann::json &j, LoopState &l) {
    l.state = j.at("state").get<char>();
    l.pos = j.at("pos").get<double>();
    l.len = j.at("len").get<double>();
    l.idx = j.at("idx").get<unsigned>();
}

// CONTROL COMMAND
void mck::to_json(nlohmann::json &j, const ControlCommand &c) {
    j["cmd"] = c.cmd;
    j["type"] = c.type;
    j["idx"] = c.idx;
}
void mck::from_json(const nlohmann::json &j, ControlCommand &c) {
    c.cmd = j.at("cmd").get<char>();
    c.type = j.at("type").get<char>();
    c.idx = j.at("idx").get<unsigned>();
}
// CONTROL COMMAND
void mck::to_json(nlohmann::json &j, const ControlState &c) {
    j["state"] = c.state;
    j["type"] = c.type;
    j["idx"] = c.idx;
}
void mck::from_json(const nlohmann::json &j, ControlState &c) {
    c.state = j.at("state").get<char>();
    c.type = j.at("type").get<char>();
    c.idx = j.at("idx").get<unsigned>();
}

// MIDI CONTROL
void mck::to_json(nlohmann::json &j, const MidiControl &m) {
    j["set"] = m.set;
    j["head"] = m.head;
    j["data"] = m.data;
    j["chan"] = m.chan;
    j["type"] = m.type;
}
void mck::from_json(const nlohmann::json &j, MidiControl &m) {
    m.set = j.at("set").get<bool>();
    m.head = j.at("head").get<unsigned char>();
    m.data = j.at("data").get<unsigned char>();
    m.chan = j.at("chan").get<unsigned char>();
    m.type = j.at("type").get<unsigned char>();
}
// COMBO CONTROL
void mck::to_json(nlohmann::json &j, const ComboControl &c) {
    j["rotary"] = c.rotary;
    j["push"] = c.push;
}
void mck::from_json(const nlohmann::json &j, ComboControl &c) {
    c.rotary = j.at("rotary").get<MidiControl>();
    c.push = j.at("push").get<MidiControl>();
}
// CONTROLS
void mck::to_json(nlohmann::json &j, const Controls &c) {
    j["activeMode"] = c.activeMode;
    j["activeChannel"] = c.activeChannel;
    j["numCombo"] = c.numCombo;
    j["numMaster"] = c.numMaster;
    j["numMode"] = c.numMode;
    j["combo"] = c.combo;
    j["master"] = c.master;
    j["mode"] = c.mode;
}
void mck::from_json(const nlohmann::json &j, Controls &c) {
    c.activeMode = j.at("activeMode").get<unsigned>();
    c.activeChannel = j.at("activeChannel").get<unsigned>();
    c.numCombo = j.at("numCombo").get<unsigned>();
    c.numMaster = j.at("numMaster").get<unsigned>();
    c.numMode = j.at("numMode").get<unsigned>();
    c.combo = j.at("combo").get<std::vector<ComboControl>>();
    c.master = j.at("master").get<std::vector<MidiControl>>();
    c.mode = j.at("mode").get<std::vector<MidiControl>>();
}

// REAL TIME DATA
void mck::to_json(nlohmann::json &j, const RealTimeData &r)
{
    j["control"] = r.control;
    j["trans"] = r.trans;
    j["tempo"] = r.tempo;
    j["rec"] = r.rec;
    j["meterIn"] = r.meterIn;
    j["meterOut"] = r.meterOut;
    j["looper"] = r.looper;
}
void mck::from_json(const nlohmann::json &j, RealTimeData &r)
{
    r.control = j.at("control").get<ControlState>();
    r.trans = j.at("trans").get<TransportState>();
    r.tempo = j.at("tempo").get<TempoData>();
    r.rec = j.at("rec").get<Recording>();
    r.meterIn = j.at("meterIn").get<std::vector<MeterItem>>();
    r.meterOut = j.at("meterOut").get<MeterItem>();
    r.looper = j.at("looper").get<std::vector<LoopState>>();
}

// CHANNEL
void mck::to_json(nlohmann::json &j, const Channel &c)
{
    j["name"] = c.name;
    j["isStereo"] = c.isStereo;
    j["mute"] = c.mute;
    j["solo"] = c.solo;
    j["gain"] = c.gain;
    j["pan"] = c.pan;
    j["sendReverb"] = c.sendReverb;
    j["sendDelay"] = c.sendDelay;
    j["sourceLeft"] = c.sourceLeft;
    j["sourceRight"] = c.sourceRight;
    j["loops"] = c.loops;
    j["numLoops"] = c.numLoops;
}
void mck::from_json(const nlohmann::json &j, Channel &c)
{
    c.name = j.at("name").get<std::string>();
    c.isStereo = j.at("isStereo").get<bool>();
    try {
        c.mute = j.at("mute").get<bool>();
        c.solo = j.at("solo").get<bool>();
    } catch (std::exception &e) {
        c.mute = false;
        c.solo = false;
    }
    c.gain = j.at("gain").get<double>();
    c.pan = j.at("pan").get<double>();
    c.sendReverb = j.at("sendReverb").get<double>();
    c.sendDelay = j.at("sendDelay").get<double>();
    c.sourceLeft = j.at("sourceLeft").get<std::string>();
    c.sourceRight = j.at("sourceRight").get<std::string>();
    try {
        c.loops = j.at("loops").get<std::vector<Loop>>();
        c.numLoops = j.at("numLoops").get<unsigned>();
    } catch (std::exception &e) {
        c.loops = std::vector<Loop>();
        c.numLoops = 0;
    }
}

// PLAYER CHANNEL
void mck::to_json(nlohmann::json &j, const PlayerChannel &c)
{
    j["playlist"] = c.playlist;
    j["gain"] = c.gain;
    j["pan"] = c.pan;
    j["sendReverb"] = c.sendReverb;
    j["sendDelay"] = c.sendDelay;
}
void mck::from_json(const nlohmann::json &j, PlayerChannel &c)
{
    c.playlist = j.at("playlist").get<std::vector<std::string>>();
    c.gain = j.at("gain").get<double>();
    c.pan = j.at("pan").get<double>();
    c.sendReverb = j.at("sendReverb").get<double>();
    c.sendDelay = j.at("sendDelay").get<double>();
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

// DELAY
void mck::to_json(nlohmann::json &j, const Delay &d) {
    j["gain"] = d.gain;
    j["delay"] = d.delay;
    j["feedback"] = d.feedback;
    j["type"] = d.type;
}
void mck::from_json(const nlohmann::json &j, Delay &d) {
    d.gain = j.at("gain").get<double>();
    d.delay = j.at("delay").get<double>();
    d.feedback = j.at("feedback").get<double>();
    d.type = j.at("type").get<unsigned>();
}

// CONFIG
void mck::to_json(nlohmann::json &j, const Config &c)
{
    j["channels"] = c.channels;
    j["channelCount"] = c.channelCount;
    j["gain"] = c.gain;
    j["clockSource"] = c.clockSource;
    j["clockTarget"] = c.clockTarget;
    j["controlSource"] = c.controlSource;
    j["controlTarget"] = c.controlTarget;
    j["targetLeft"] = c.targetLeft;
    j["targetRight"] = c.targetRight;
    j["player"] = c.player;
    j["reverb"] = c.reverb;
    j["delay"] = c.delay;
    j["controls"] = c.controls;
}
void mck::from_json(const nlohmann::json &j, Config &c)
{
    c.channels = j.at("channels").get<std::vector<Channel>>();
    c.channelCount = j.at("channelCount").get<unsigned>();
    c.gain = j.at("gain").get<double>();
    try {
        c.clockSource = j.at("clockSource").get<std::vector<std::string>>();
    } catch (std::exception &e) {
        c.clockSource = std::vector<std::string>();
    }
    try {
        c.clockTarget = j.at("clockTarget").get<std::vector<std::string>>();
    } catch (std::exception &e) {
        c.clockTarget = std::vector<std::string>();
    }
    try {
        c.controlSource = j.at("controlSource").get<std::vector<std::string>>();
    } catch (std::exception &e) {
        c.controlSource = std::vector<std::string>();
    }
    try {
        c.controlTarget = j.at("controlTarget").get<std::vector<std::string>>();
    } catch (std::exception &e) {
        c.controlTarget = std::vector<std::string>();
    }
    c.targetLeft = j.at("targetLeft").get<std::vector<std::string>>();
    c.targetRight = j.at("targetRight").get<std::vector<std::string>>();
    c.reverb = j.at("reverb").get<Reverb>();
    c.delay = j.at("delay").get<Delay>();
    try {
        c.player = j.at("player").get<PlayerChannel>();
    } catch (std::exception &e) {
        c.player = PlayerChannel();
    }
    try {
        c.controls = j.at("controls").get<Controls>();
    } catch (std::exception &e) {
        c.controls = Controls();
    }
}