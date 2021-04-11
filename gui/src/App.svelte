<script>
  import { onMount, onDestroy } from "svelte";
  import { DbToLog, LogToDb } from "./mck/utils/Tools.svelte";
  import Settings from "./Settings.svelte";
  import Slider from "./mck/controls/Slider.svelte";
  import SliderLabel from "./mck/controls/SliderLabel.svelte";
  import Modal from "./mck/container/Modal.svelte";
  import Channel from "./Channel.svelte";
  import ReverbSend from "./ReverbSend.svelte";
  import DelaySend from "./DelaySend.svelte";
import ControlSettings from "./ControlSettings.svelte";

  let port = 9001;
  let socket = undefined;
  let socketConnected = false;
  let pingId = -1;
  let gain = 0.0;
  let data = undefined;
  let dataReady = false;
  let sources = [];
  let targets = [];

  let revTypes = ["STREV", "PROG2", "ZREV2", "NREVB"];
  let rtData = {};

  let showControlSettings = false;

  function SendValue(_idx, _section, _type, _val) {
    let _data = JSON.parse(JSON.stringify(data));
    if (_section == "channels") {
      _data.channels[_idx][_type] = _val;
    } else if (_section == "master") {
      _data[_type] = _val;
    } else if (_section == "reverb") {
      _data.reverb[_type] = _val;
    } else if (_section == "delay") {
      _data.delay[_type] = _val;
    }
    let _msg = {
      msgType: "partial",
      section: "config",
      data: JSON.stringify(_data),
    };
    SendMessage(_msg);
  }
  function ReceiveBackendMessage(_event) {
    if (_event.detail.msgType == "pong") {
      RecvPing();
      return;
    }
    if (_event.detail.msgType == "partial") {
      if (_event.detail.section == "config") {
        data = _event.detail.data;
        dataReady = true;
      } else if (_event.detail.section == "source") {
        sources = _event.detail.data;
      } else if (_event.detail.section == "target") {
        targets = _event.detail.data;
      }
    } else if (_event.detail.msgType == "realtime") {
      if (_event.detail.section == "system") {
        rtData = _event.detail.data;
      }
    }
  }

  function RecvPing() {
    window.clearTimeout(pingId);
    pingId = window.setTimeout(SendPing, 50);
  }

  function SendMsg(_msgType, _section, _data) {
    let _msg = {
      msgType: _msgType,
      section: _section,
      data: _data,
    };
    SendMessage(_msg);
  }

  function SendPing() {
    window.clearTimeout(pingId);
    let _msg = {
      msgType: "ping",
      section: "system",
      data: "",
    };
    SendMessage(_msg);
  }

  onMount(() => {
    document.addEventListener("backendMessage", ReceiveBackendMessage);
    SendMessage({
      section: "data",
      msgType: "get",
      data: "",
    });
    SendPing();
  });
  onDestroy(() => {
    document.removeEventListener("backendMessage", ReceiveBackendMessage);
  });
</script>

<div class="base">
  {#if dataReady}
    <div class="settings">
      <Settings
        {rtData}
        {data}
        SendValue={(t, v) => SendValue(0, "master", t, v)}
        {SendMsg}
        {targets}
        bind:showControlSettings
      />
    </div>
    <div class="channels">
      {#each data.channels as chan, i}
        <Channel
          active={data.channelControls.activeChannel == i}
          index={i}
          data={chan}
          {SendMsg}
          {sources}
          meter={rtData.hasOwnProperty("meterIn")
            ? rtData.meterIn[i]
            : undefined}
          looper={rtData.hasOwnProperty("looper")
            ? rtData.looper[i]
            : undefined}
          SendValue={(t, v) => SendValue(i, "channels", t, v)}
        />
      {/each}
    </div>
    <div class="sends">
      <ReverbSend
        index={0}
        data={data.reverb}
        SendValue={(t, v) => SendValue(null, "reverb", t, v)}
      />
      <DelaySend
        index={1}
        data={data.delay}
        SendValue={(t, v) => SendValue(null, "delay", t, v)}
      />
    </div>
    <!--
    <div class="master">
      {#if data != undefined}
        <Slider
          vertical={true}
          value={DbToLog(data.gain)}
          Handler={_v => SendValue(undefined, 'master', 'gain', LogToDb(_v))} />
      {/if}
    </div>
    -->
  {/if}
</div>

{#if showControlSettings && dataReady}
  <Modal title="Channel Control Settings" bind:show={showControlSettings}>
    <ControlSettings data={data.channelControls} {SendMsg}/>
    </Modal>
{/if}

<style>
  .base {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: min-content 1fr auto auto;
    /*grid-row-gap: 1px;
    grid-column-gap: 1px;*/
    background-color: #333;
  }
  .settings {
    grid-column: 1/2;
    overflow-y: auto;
    padding: 8px;
    background-color: #f0f0f0;
    z-index: 10;
    box-shadow: 1px 0px 4px 1px #555;
  }
  .channels {
    grid-column: 2/3;
    padding: 8px;
    height: calc(100% - 16px);
    width: calc(100% - 16px);
    overflow-x: auto;
    overflow-y: auto;
    background-color: #f0f0f0;
    display: grid;
    /*grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));*/
    grid-auto-flow: column;
    grid-auto-columns: 140px; /*minmax(140px, max-content);*/
    grid-template-rows: 1fr;
    /*
    grid-auto-columns: min-content;
    grid-auto-flow: column;*/
    grid-gap: 8px;
  }
  .sends {
    grid-column: -3/-2;
    padding: 8px;
    height: calc(100% - 16px);
    width: calc(100% - 16px);
    background-color: #f0f0f0;
    display: grid;
    grid-template-columns: 140px;
    grid-template-rows: 1fr 1fr;
    grid-gap: 8px;
    z-index: 10;
    box-shadow: -1px 0px 4px 1px #555;
  }
  .master {
    grid-column: -2/-1;
    padding: 8px;
    background-color: #f0f0f0;
  }
</style>
