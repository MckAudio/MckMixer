<script>
    import SliderLabel from "./SliderLabel.svelte";

    export let data = undefined;
    export let SendValue = undefined;
    export let SendMsg = undefined;


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
</script>

<style>
    .base {
        display: grid;
        grid-auto-rows: auto;
        grid-template-columns: 50px 1fr;
        width: 160px;
        font-size: 14px;
        font-family: mck-lato
    }
</style>

<div class="base">
    <span>Add:</span>
    <button type="button" on:click={()=>AddChannel(false)}>Mono</button>
    <span/>
    <button type="button" on:click={()=>AddChannel(true)}>Stereo</button>
</div>