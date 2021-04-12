<script>
  import SliderLabel from "./mck/controls/SliderLabel.svelte";
  import Slider from "./mck/controls/Slider.svelte";
  import Select from "./mck/controls/Select.svelte";
  import Button from "./mck/controls/Button.svelte";
  import Meter from "./mck/controls/Meter.svelte";
  import InputText from "./mck/controls/InputText.svelte";
  import {
    DbToLog,
    LogToDb,
    FormatPan,
    FormatCon,
  } from "./mck/utils/Tools.svelte";

  export let data = undefined;
  export let SendValue = undefined;
  export let SendMsg = undefined;
  export let index = 0;
  export let sources = [];
  export let meter = undefined;
  export let looper = undefined;
  export let active = false;
  export let highlight = false;

  const state = [
    "Idle",
    "Should Play",
    "Playing",
    "Should Record",
    "Recording",
    "Should Stop",
    "Should Stop",
    "Stopped",
  ];

  function RemoveChannel() {
    let _data = JSON.stringify({
      command: "remove",
      isStereo: data.isStereo,
      idx: index,
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
      target: _source,
    });
    if (SendMsg) {
      SendMsg("command", "connection", _data);
    }
  }

  function SendLoopCmd(_cmd) {
    let _data = JSON.stringify({
      chanIdx: index,
      loopIdx: 0,
      mode: _cmd,
    });
    if (SendMsg) {
      SendMsg("command", "loop", _data);
    }
  }
</script>

<div class="base {active ? 'active' : highlight ? 'highlight' : ''}">
  <i>{index + 1}</i>
  <InputText value={data.name} Handler={(_v) => SendValue("name", _v)} />
  {#if meter != undefined}
    <div class="control">
      <i>Meter:</i>
      <Meter value={meter} stereo={data.isStereo} />
    </div>
  {/if}
  <div class="control">
    <i>Type:</i>
    <div class="splitter">
      <Button
        value={data.isStereo == false}
        Handler={() => SendValue("isStereo", false)}
      >
        Mono
      </Button>
      <Button value={data.isStereo} Handler={() => SendValue("isStereo", true)}>
        Stereo
      </Button>
    </div>
  </div>
  {#if data.isStereo}
    <div class="control">
      <i>Left Source:</i>
      <Select
        items={sources}
        value={data.sourceLeft}
        numeric={false}
        Opener={() => SendMsg("request", "source", "")}
        Handler={(_v) => ConnectChannel(_v, false)}
        Formatter={FormatCon}
      />
    </div>
    <div class="control">
      <i>Right Source:</i>
      <Select
        items={sources}
        value={data.sourceRight}
        numeric={false}
        Opener={() => SendMsg("request", "target", "")}
        Handler={(_v) => ConnectChannel(_v, true)}
        Formatter={FormatCon}
      />
    </div>
  {:else}
    <div class="control">
      <i>Source:</i>
      <Select
        items={["disconnect", ...sources]}
        value={data.sourceLeft}
        numeric={false}
        Opener={() => SendMsg("request", "source", "")}
        Handler={(_v) => ConnectChannel(_v, false)}
        Formatter={FormatCon}
      />
    </div>
    <div class="rest" />
  {/if}
  <div class="control">
    <i>Pan:</i>
    <SliderLabel
      centered={true}
      label={FormatPan(data.pan)}
      value={data.pan / 100.0}
      Handler={(_v) => SendValue("pan", _v * 100.0)}
    />
  </div>
  <div class="control">
    <i>Reverb Send:</i>
    <SliderLabel
      label={Math.round(data.sendReverb) + " dB"}
      value={DbToLog(data.sendReverb)}
      Handler={(_v) => SendValue("sendReverb", LogToDb(_v))}
    />
  </div>
  <div class="control">
    <i>Delay Send:</i>
    <SliderLabel
      label={Math.round(data.sendDelay) + " dB"}
      value={DbToLog(data.sendDelay)}
      Handler={(_v) => SendValue("sendDelay", LogToDb(_v))}
    />
  </div>
  <div class="rest" />
  <div class="control">
    <i>Mute & Solo:</i>
    <div class="gritter">
      <Button Handler={() => SendValue("mute", !data.mute)} value={data.mute}
        >Mute</Button
      >
      <Button Handler={() => SendValue("solo", !data.solo)} value={data.solo}
        >Solo</Button
      >
    </div>
  </div>
  <div class="control">
    <i>Input Gain:</i>
    <SliderLabel
      label={Math.round(data.inputGain) + " dB"}
      value={DbToLog(data.inputGain)}
      Handler={(_v) => SendValue("inputGain", LogToDb(_v))}
    />
  </div>
  <div class="control">
    <i>Loop Gain:</i>
    <SliderLabel
      label={Math.round(data.loopGain) + " dB"}
      value={DbToLog(data.loopGain)}
      Handler={(_v) => SendValue("loopGain", LogToDb(_v))}
    />
  </div>
  <div class="control">
    <i>Master Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + " dB"}
      value={DbToLog(data.gain)}
      Handler={(_v) => SendValue("gain", LogToDb(_v))}
    />
  </div>
  <div class="rest" />
  <div class="control">
    <i>Controls:</i>
    <Button Handler={() => RemoveChannel()}>Delete Channel</Button>
  </div>
  {#if looper}
    {#if looper.hasOwnProperty("state")}
      <div class="control">
        <i>Loops:</i>
        <div class="gritter">
          <Button disabled={looper.state != 0} Handler={() => SendLoopCmd(2)}>
            Record
          </Button>
          <Button disabled={looper.state != 0} Handler={() => SendLoopCmd(1)}>
            Play
          </Button>
          <Button
            disabled={looper.state == 0 ||
              looper.state == 5 ||
              looper.state == 6}
            Handler={() => SendLoopCmd(3)}
          >
            Stop
          </Button>
        </div>
      </div>
      {#if looper.state == 2 || looper.state == 4}
        <div class="control">
          <i>Loop Position:</i>
          <SliderLabel
            disabled={true}
            label={Math.round(looper.pos * 100.0) + " %"}
            value={looper.pos}
          />
        </div>
      {/if}
      <div class="control">
        <i>Loop State:</i>
        <span>{state[looper.state]}</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .base {
    background-color: var(--bg2-color);
    border: 1px solid var(--border-light-color);
    padding: 4px;
    width: calc(100% - 10px);
    height: calc(100% - 10px);
    display: grid;
    grid-auto-rows: min-content; /*minmax(min-content, max-content);*/
    grid-gap: 4px;
    border-radius: 2px;
  }

  .base.active {
    background-color: var(--hl-color);
  }

  .base.highlight, .base.active {
    border-color: var(--hl-border-color);
  }

  .base > i,
  .base > span,
  .base > button {
    text-align: center;
    font-family: var(--font-family);
    font-size: var(--font-size);
  }

  span {
    text-align: center;
    font-family: var(--font-family);
    font-size: var(--font-size);
  }

  .control {
    display: grid;
    grid-template-rows: auto minmax(24px, auto);
    grid-row-gap: 2px;
    row-gap: 2px;
    font-size: var(--font-size);
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
    font-family: var(--font-family);
    font-size: var(--font-size);
    text-align: center;
    border: 1px solid #222;
    border-radius: 2px;
    cursor: pointer;
  }
  .rest {
    height: 43px;
  }
</style>
