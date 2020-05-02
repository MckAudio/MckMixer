<script>
  import { onMount, onDestroy } from "svelte";
  import { DbToLog, LogToDb } from "./Tools.svelte";
  import Settings from "./Settings.svelte";
  import Slider from "./Slider.svelte";
  import SliderLabel from "./SliderLabel.svelte";
  import Channel from "./Channel.svelte";
  import ReverbSend from "./ReverbSend.svelte";
  import DelaySend from "./DelaySend.svelte";

  export let name;

  let port = 9001;
  let socket = undefined;
  let socketConnected = false;
  let pingId = -1;
  let gain = 0.0;
  let data = undefined;
  let sources = [];
  let targets = [];

  let revTypes = ["STREV", "PROG2", "ZREV2", "NREVB"];

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
      data: JSON.stringify(_data)
    };
    if (socketConnected) {
      socket.send(JSON.stringify(_msg));
    } else {
      Connect("ws://127.0.0.1", port);
      socket.send(JSON.stringify(_msg));
    }
  }
  function RecvMsg(_msg) {
    if (_msg === undefined) {
      return;
    }
    let _tmp = JSON.parse(_msg);
    //console.log("[MSG]", _tmp);
    if (_tmp.msgType == "pong") {
      RecvPing();
      return;
    }
    if (_tmp.msgType == "partial") {
      if (_tmp.section == "config") {
        let _data = JSON.parse(_tmp.data);
        data = _data;
      } else if (_tmp.section == "source") {
        let _sources = JSON.parse(_tmp.data);
        sources = _sources;
      } else if (_tmp.section == "target") {
        let _targets = JSON.parse(_tmp.data);
        targets = _targets;
      }
    }
  }

  function RecvPing() {
    window.clearTimeout(pingId);
    pingId = window.setTimeout(SendPing, 1000);
  }

  function SendMsg(_msgType, _section, _data) {
    let _msg = {
      msgType: _msgType,
      section: _section,
      data: _data
    };
    if (socketConnected) {
      socket.send(JSON.stringify(_msg));
    }
  }

  function SendPing() {
    window.clearTimeout(pingId);
    let _msg = {
      msgType: "ping",
      section: "system",
      data: ""
    };
    if (socketConnected) {
      socket.send(JSON.stringify(_msg));
    } else {
      pingId = window.setTimeout(SendPing, 1000);
    }
  }

  function Connect(_url, _port) {
    let _uri = `${_url}:${_port}`;
    console.log(_uri);
    socket = new WebSocket(_uri);
    socket.onopen = _evt => {
      console.log("WS was opened!");
      socketConnected = true;
      pingId = window.setTimeout(SendPing, 1000);
    };
    socket.onclose = _evt => {
      console.log("WS was closed!");
      socketConnected = false;
    };
    socket.onmessage = _evt => RecvMsg(_evt.data);
  }
  onMount(() => {
    let _uri = document.URL;
    let _url = _uri.substring(_uri.indexOf("://") + 3, _uri.lastIndexOf(":"));
    Connect("ws://" + _url, port);
  });
  onDestroy(() => {
    if (socketConnected) {
      socket.close();
    }
  });

  function AddChannel(_isStereo) {
    let _msg = {
      msgType: "command",
      section: "channel",
      data: JSON.stringify({
        command: "add",
        isStereo: _isStereo,
        idx: 0
      })
    };
    if (socketConnected) {
      socket.send(JSON.stringify(_msg));
    }
  }
</script>

<style>
  .base {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
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
    overflow-y: hidden;
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

<div class="base">
  {#if data != undefined}
    <div class="settings">
      <Settings {data} SendValue={(t,v) => SendValue(0, 'master', t, v)} {SendMsg} {targets}/>
    </div>
    <div class="channels">
      {#each data.channels as chan, i}
        <Channel
          index={i}
          data={chan}
          {SendMsg}
          {sources}
          SendValue={(t, v) => SendValue(i, 'channels', t, v)} />
      {/each}
    </div>
    <div class="sends">
      <ReverbSend
        index={0}
        data={data.reverb}
        SendValue={(t, v) => SendValue(null, 'reverb', t, v)} />
      <DelaySend
        index={1}
        data={data.delay}
        SendValue={(t, v) => SendValue(null, 'delay', t, v)} />
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
