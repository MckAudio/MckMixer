<script>
  import SliderLabel from "./SliderLabel.svelte";
  import Slider from "./Slider.svelte";
  import { DbToLog, LogToDb, FormatPan } from "./Tools.svelte";

  export let data = undefined;
  export let SendValue = undefined;
  export let SendMsg = undefined;
  export let index = 0;
  export let sources = [];

  function RemoveChannel() {
    let _data = JSON.stringify({
      command: "remove",
      isStereo: data.isStereo,
      idx: index
    });

    if (SendMsg) {
      SendMsg("command", "channel", _data);
    }
  }

  function ConnectChannel(_source, _rightChannel) {
    let _data = JSON.stringify({
      isInput: true,
      idx: index,
      subIdx: _rightChannel ? 1 : 0,
      command: _source == "disconnect" ? "disconnect" : "connect",
      target: _source
    });
    if (SendMsg) {
      SendMsg("command", "connection", _data);
    }
  }
</script>

<style>
  .base {
    background-color: #e0e0e0;
    padding: 4px;
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    display: grid;
    grid-auto-rows: minmax(min-content, max-content);
    grid-gap: 4px;
    border-radius: 2px;
  }

  .base > i,
  .base > span,
  .base > button {
    text-align: center;
    font-family: mck-lato;
    font-size: 14px;
  }

  .control {
    display: grid;
    grid-template-rows: auto minmax(24px, auto);
    grid-row-gap: 2px;
    row-gap: 2px;
    font-size: 14px;
  }
  .splitter {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 2px;
    column-gap: 2px;
  }
  button {
    border-radius: 2px;
    border: 1px solid #222;
    cursor: pointer;
  }
  button.active {
    background-color: #666;
    color: #f0f0f0;
  }
  select {
    height: 24px;
    padding: 0px;
    color: #222;
    background-color: #f0f0f0;
    font-family: mck-lato;
    font-size: 14px;
    text-align: center;
    border: 1px solid #222;
    border-radius: 2px;
    cursor: pointer;
  }
  .rest {
    height: 43px;
  }
</style>

<div class="base">
  <i>{index + 1}</i>
  <span>{data.name}</span>
  <div class="control">
    <i>Type:</i>
    <div class="splitter">
      <button
        class="left {data.isStereo ? '' : 'active'}"
        on:click={() => SendValue('isStereo', false)}>
        Mono
      </button>
      <button
        class="right {data.isStereo ? 'active' : ''}"
        on:click={() => SendValue('isStereo', true)}>
        Stereo
      </button>
    </div>
  </div>
  <div class="control">
  <i>Source:</i>
  {#if data.isStereo}
    <div class="splitter">
    <select class="left"on:click={()=> SendMsg("request","source", "")} on:change={_e => {
      ConnectChannel(_e.target.value, false);
    }}>
      <option style="display: none" selected>{data.sourceLeft}</option>
      <option value="disconnect"><i>Disconnect</i></option>
      {#each sources as source}
        <option val={source}>{source}</option>
      {/each}
    </select>
    <select class="right" on:click={()=> SendMsg("request","source", "")} on:change={_e => {
      ConnectChannel(_e.target.value, true);
    }}>
      <option style="display: none" selected>{data.sourceRight}</option>
      <option value="disconnect"><i>Disconnect</i></option>
      {#each sources as source}
        <option val={source}>{source}</option>
      {/each}
    </select>
    </div>
  {:else}
    <select on:click={()=> SendMsg("request","source", "")} on:change={_e => {
      ConnectChannel(_e.target.value, false);
    }}>
      <option style="display: none" selected>{data.sourceLeft}</option>
      <option value="disconnect"><i>Disconnect</i></option>
      {#each sources as source}
        <option val={source}>{source}</option>
      {/each}
    </select>
  {/if}
  </div>
  <div class="control">
    <i>Pan:</i>
    <SliderLabel
      centered={true}
      label={FormatPan(data.pan)}
      value={data.pan / 100.0}
      Handler={_v => SendValue('pan', _v * 100.0)} />
  </div>
  <div class="control">
    <i>Reverb Send:</i>
    <SliderLabel
      label={Math.round(data.sendReverb) + ' dB'}
      value={DbToLog(data.sendReverb)}
      Handler={_v => SendValue('sendReverb', LogToDb(_v))} />
  </div>
  <div class="control">
    <i>Delay Send:</i>
    <SliderLabel
      label={Math.round(data.sendDelay) + ' dB'}
      value={DbToLog(data.sendDelay)}
      Handler={_v => SendValue('sendDelay', LogToDb(_v))} />
  </div>
  <div class="rest" />
  <div class="control">
    <i>Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + ' dB'}
      value={DbToLog(data.gain)}
      Handler={_v => SendValue('gain', LogToDb(_v))} />
  </div>
  <div class="rest" />
  <div class="control">
    <i>Controls:</i>
    <button type="button" on:click={() => RemoveChannel()}>
      Delete Channel
    </button>
  </div>
</div>
