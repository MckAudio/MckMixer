<script>
  import SliderLabel from "./SliderLabel.svelte";
  import Slider from "./Slider.svelte";
  import Select from "./Select.svelte";
  import { DbToLog, LogToDb, FormatPan } from "./Tools.svelte";

  export let data = undefined;
  export let SendValue = undefined;
  export let index = 0;

  let types = ["ST Rev", "Prog", "Z Rev", "N Rev"];
</script>

<style>
  .base {
    background-color: #4dd100;
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
  <i>FX {index + 1}</i>
  <span>Reverb</span>
  <div class="control">
    <i>Type:</i>
    <Select
      items={types}
      value={data.type}

      Handler={_v => 
        SendValue('type', _v)
      }/>
  </div>
  <div class="control">
    <i>RT60:</i>
    <SliderLabel
      label={(Math.round(data.rt60 * 100.0) / 100.0).toFixed(2) + " s"}
      value={(data.rt60 - 0.1) / (5.0 - 0.1)}
      Handler={_v => SendValue('rt60', 0.1 + _v * (5.0 - 0.1))} />
  </div>
  <div class="rest"/>
  <div class="rest"/>
  <div class="control">
    <i>Gain:</i>
    <SliderLabel
      label={Math.round(data.gain) + ' dB'}
      value={DbToLog(data.gain)}
      Handler={_v => SendValue('gain', LogToDb(_v))} />
  </div>
</div>
