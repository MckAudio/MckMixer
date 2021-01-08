<script>
  import SliderLabel from "../MckSvelte/controls/SliderLabel.svelte";
  import Select from "../MckSvelte/controls/Select.svelte";
  import Button from "../MckSvelte/controls/Button.svelte";
  import Meter from "../MckSvelte/controls/Meter.svelte";
  import { DbToLog, LogToDb, FormatCon } from "../MckSvelte/utils/Tools.svelte";

  export let data = undefined;
  export let rtData = undefined;
  export let SendValue = undefined;
  export let SendMsg = undefined;
  export let targets = [];

  let tempo = 120;

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
  function SendTransCmd(_cmd) {
    let _data = JSON.stringify({
      mode: _cmd,
      tempo: 0.0
    });
    if (SendMsg) {
      SendMsg("command", "transport", _data);
    }
  }
  function ChangeTempo(_tempo) {
    let _data = JSON.stringify({
      mode: 4,
      tempo: _tempo
    });
    if (SendMsg) {
      SendMsg("command", "transport", _data);
      tempo = _tempo;
    }
  }
</script>

<style>
  .base {
    display: grid;
    grid-auto-rows: auto;
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
  .gritter {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
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
      <Button Handler={() => AddChannel(false)}>Mono</Button>
      <Button Handler={() => AddChannel(true)}>Stereo</Button>
    </div>
  </div>
  <!-- TARGET -->
  <div class="control">
    <i>Left Output Target:</i>
    <Select
      items={targets}
      value={data.targetLeft}
      numeric={false}
      Opener={() => SendMsg('request', 'target', '')}
      Handler={_v => ConnectMaster(_v, false)}
      Formatter={FormatCon} />
  </div>
  <div class="control">
    <i>Right Output Target:</i>
    <Select
      items={targets}
      value={data.targetRight}
      numeric={false}
      Opener={() => SendMsg('request', 'target', '')}
      Handler={_v => ConnectMaster(_v, true)}
      Formatter={FormatCon} />
  </div>

  <!-- METER -->
  {#if rtData}
    {#if rtData.hasOwnProperty('meterOut')}
      <div class="control">
        <i>Meter:</i>
        <Meter stereo={true} value={rtData.meterOut} />
      </div>
    {/if}
  {/if}

  <!-- GAIN -->
  <div class="control">
    <i>Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + ' dB'}
      value={DbToLog(data.gain)}
      Handler={_v => SendValue('gain', LogToDb(_v))} />
  </div>

  <!-- RECORDING -->
  {#if rtData}
    {#if rtData.hasOwnProperty('rec')}
      <div class="control">
        <i>Recording:</i>
        <div class="splitter">
          <Button
            disabled={rtData.rec.isActive}
            Handler={() => {
              SendMsg('command', 'recording', 'start');
            }}>
            Start
          </Button>
          <Button
            disabled={!rtData.rec.isActive}
            Handler={() => {
              SendMsg('command', 'recording', 'stop');
            }}>
            Stop
          </Button>
        </div>
      </div>
      {#if rtData.rec.isActive}
        <div class="control">
          <i>Recorded Time:</i>
          <span>
            {`${rtData.rec.recHours
              .toString()
              .padStart(
                2,
                '0'
              )}:${rtData.rec.recMins
              .toString()
              .padStart(
                2,
                '0'
              )}:${rtData.rec.recSecs
              .toString()
              .padStart(
                2,
                '0'
              )}.${rtData.rec.recMiSecs.toString().padStart(3, '0')}`}
          </span>
        </div>
      {/if}
    {/if}
  {/if}

  <!-- TRANSPORT -->
  {#if rtData}
    {#if rtData.hasOwnProperty("trans")}
  <div class="control">
    <i>Transport:</i>
    <div class="gritter">
      <Button disabled={rtData.trans.state == 1} Handler={()=>SendTransCmd(2)}>Start</Button>
      <Button disabled={rtData.trans.state == 1} Handler={()=>SendTransCmd(3)}>Cont</Button>
      <Button disabled={rtData.trans.state == 0} Handler={()=>SendTransCmd(1)}>Stop</Button>
    </div>
  </div>
  <div class="control">
    <i>Tempo:</i>
    <SliderLabel
      label={rtData.trans.tempo.toFixed(2) + ' bpm'}
      value={(rtData.trans.tempo - 30.0)/ 270.0}
      Handler={_v => ChangeTempo(_v * 270.0 + 30)} />
  </div>
  <div class="control">
    <i>Position:</i>
    <span>{(rtData.trans.bar + 1).toString().padStart(4, '0') + ' - ' +(rtData.trans.beat + 1).toString() + ' / ' + (rtData.trans.nBeats).toString()}</span>
  </div>
  {/if}
  {/if}

  <!-- CLOSE -->
  <div class="control">
    <i>Controls:</i>
    <Button
      Handler={() => {
        SendMsg('command', 'system', 'close');
      }}>
      Close
    </Button>
  </div>
</div>
