<script>
  import SliderLabel from "./SliderLabel.svelte";
  import Slider from "./Slider.svelte";
  import { DbToLog, LogToDb, FormatPan } from "./Tools.svelte";

  export let data = undefined;
  export let SendValue = undefined;
  export let index = 0;
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
  .base > span {
    text-align: center;
    font-family: mck-lato;
    font-size: 14px;
  }

  .control {
    display: grid;
    grid-template-rows: auto 24px;
    grid-row-gap: 2px;
    row-gap: 2px;
    font-size: 14px;
  }
  .rest {
    height: 43px;
  }
</style>

<div class="base">
  <i>{index + 1}</i>
  <span>{data.name}</span>
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
  <div class="rest"/>
  <div class="control">
    <i>Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + ' dB'}
      value={DbToLog(data.gain)}
      Handler={_v => SendValue('gain', LogToDb(_v))} />
  </div>
</div>
