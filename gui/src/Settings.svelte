<script>
  import SliderLabel from "./SliderLabel.svelte";
  import Select from "./Select.svelte";
  import { DbToLog, LogToDb, FormatCon } from "./Tools.svelte";

  export let data = undefined;
  export let SendValue = undefined;
  export let SendMsg = undefined;
  export let targets = [];

  function AddChannel(_isStereo) {
    let _data = JSON.stringify({
      command: "add",
      isStereo: _isStereo,
      idx: 0
    });

    if (SendMsg) {
      SendMsg("command", "channel", _data);
    }
  }
  function ConnectMaster(_target, _rightChannel) {
    let _data = JSON.stringify({
      isInput: false,
      idx: 0,
      subIdx: _rightChannel ? 1 : 0,
      command: _target == "disconnect" ? "disconnect" : "connect",
      target: _target
    });
    if (SendMsg) {
      SendMsg("command", "connection", _data);
    }
  }
</script>

<style>
  .base {
    display: grid;
    grid-auto-rows: auto;
    width: 160px;
    font-size: 14px;
    font-family: mck-lato;
    row-gap: 4px;
    grid-row-gap: 4px;
  }
  h1 {
    font-size: 18px;
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
</style>

<div class="base">
  <h1>MCK Mixer</h1>
  <div class="control">
    <i>New Channel:</i>
    <div class="splitter">
      <button type="button" on:click={() => AddChannel(false)}>Mono</button>
      <button type="button" on:click={() => AddChannel(true)}>Stereo</button>
    </div>
  </div>
  <!-- TARGET -->
  <div class="control">
    <i>Output Target:</i>
    <div class="splitter">
      <Select
        items={targets}
        value={data.targetLeft}
        numeric={false}
        Opener={() => SendMsg('request', 'target', '')}
        Handler={_v => ConnectMaster(_v, false)}
        Formatter={FormatCon} />

      <Select
        items={targets}
        value={data.targetRight}
        numeric={false}
        Opener={() => SendMsg('request', 'target', '')}
        Handler={_v => ConnectMaster(_v, true)}
        Formatter={FormatCon} />
      <!--
    <select class="left"on:click={()=> SendMsg("request","target", "")} on:change={_e => {
      ConnectMaster(_e.target.value, false);
    }}>
      <option style="display: none" selected>{FormatCon(data.targetLeft)}</option>
      <option value="disconnect"><i>Disconnect</i></option>
      {#each targets as target}
        <option val={target}>{target}</option>
      {/each}
    </select>
    -->
      <!--
      <select
        class="right"
        on:click={() => SendMsg('request', 'target', '')}
        on:change={_e => {
          ConnectMaster(_e.target.value, true);
        }}>
        <option style="display: none" selected>
          {FormatCon(data.targetRight)}
        </option>
        <option value="disconnect">
          <i>Disconnect</i>
        </option>
        {#each targets as target}
          <option val={target}>{target}</option>
        {/each}
      </select>
      -->
    </div>
  </div>

  <!-- GAIN -->
  <div class="control">
    <i>Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + ' dB'}
      value={DbToLog(data.gain)}
      Handler={_v => SendValue('gain', LogToDb(_v))} />
  </div>
</div>
