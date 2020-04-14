<script>
  import { onMount, onDestroy } from "svelte";

  export let name;

  let port = 9001;
  let socket = undefined;
  let socketConnected = false;
  let gain = 0.0;
  let data = undefined;

  function SendValue(_idx, _section, _type, _val) {
    let _data = JSON.parse(JSON.stringify(data));
    if (_section == "channels") {
    _data.channels[_idx][_type] = _val;
    } else if (_section == "master") {
      _data[_type] = _val;
    } else if (_section == "reverb") {
      _data.reverb[_type] = _val;
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
    let _tmp = JSON.parse(_msg);
    if (_tmp.msgType == "partial" && _tmp.section == "config") {
      let _data = JSON.parse(_tmp.data);
      data = _data;
      console.log("[NEW DATA]", data);
    }
  }

  function Connect(_url, _port) {
    let _uri = `${_url}:${_port}`;
    console.log(_uri);
    socket = new WebSocket(_uri);
    socket.onopen = _evt => {
      console.log("WS was opened!");
      socketConnected = true;
    };
    socket.onclose = _evt => {
      console.log("WS was closed!");
      socketConnected = false;
    };
    socket.onmessage = _evt => RecvMsg(_evt.data);
  }
  onMount(() => {
    Connect("ws://127.0.0.1", port);
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
  .channel {
    padding: 16px;
    display: grid;
    grid-template-columns: 25px 1fr 50px 2fr;
  }
</style>

<main>
  {#if data != undefined}
      <div class="channel">
        <i></i>
        <span>Master</span>
        <span>{data.gain} dB</span>
        <input
          type="range"
          value={Math.round(data.gain).toString()}
          min="-60"
          max="6"
          on:change={e => SendValue(undefined, 'master', 'gain', Number(e.target.value))} />
      </div>
      <div class="channel">
        <i></i>
        <span>Master</span>
        <span>{data.reverb.rt60} s</span>
        <input
          type="range"
          value={Math.round(data.reverb * 10.0).toString()}
          min="5.0"
          max="100.0"
          on:change={e => SendValue(undefined, 'reverb', 'rt60', Number(e.target.value) / 10.0)} />
      </div>


    {#each data.channels as chan, i}
      <div class="channel">
        <i>#{i + 1}</i>
        <span>{chan.name}</span>
        <span>{chan.gain} dB</span>
        <input
          type="range"
          value={Math.round(chan.gain).toString()}
          min="-60"
          max="6"
          on:change={e => SendValue(i, 'channels', 'gain', Number(e.target.value))} />
      </div>
      <div class="channel">
        <i></i>
        <span>Pan</span>
        <span>{chan.pan} %</span>
        <input
          type="range"
          value={Math.round(chan.pan).toString()}
          min="0"
          max="100"
          on:change={e => SendValue(i, 'channels', 'pan', Number(e.target.value))} />
      </div>
      <div class="channel">
        <i></i>
        <span>Reverb Send</span>
        <span>{chan.send} dB</span>
        <input
          type="range"
          value={Math.round(chan.send).toString()}
          min="-60"
          max="20"
          on:change={e => SendValue(i, 'channels', 'send', Number(e.target.value))} />
      </div>
    {/each}
    <button type="button" on:click={() => AddChannel(false)}>
      Add new mono channel
    </button>
    <button type="button" on:click={() => AddChannel(true)}>
      Add new stereo channel
    </button>
  {/if}
</main>
