<script>
  import { DbToLog } from "./Tools.svelte";

  export let value = undefined;
  export let stereo = false;

  let w = 0;
  let h = 0;

  let valueLeft = -200.0;
  let valueRight = -200.0;

  $: if (value != undefined) {
    valueLeft = DbToLog(value.l);
    valueRight = DbToLog(value.r);
  }
</script>

<style>
  .main {
    background-color: #f0f0f0;
    border: 1px solid #222;
    width: calc(100% - 2px);
    height: 22px;
    overflow: hidden;
    box-shadow: 0px 1px 2px 0px #555;
  }
  .main > div {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  svg {
    width: 100%;
    height: 100%;
  }
</style>

<div class="main">
  <div bind:clientWidth={w} bind:clientHeight={h}>
    <svg>
    <defs>
        <linearGradient id="grad1" x1="0" x2="{w}" y1="0" y2="{h}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#666"></stop>
            <stop offset="100%" stop-color="#222"></stop>
        </linearGradient>
    </defs>
        <g fill="url(#grad1)">
      {#if stereo}
        <rect x="0" y="0" width="{valueLeft * w}" height={h/2}/>
        <rect x="0" y="{h/2}" width="{valueRight * w}" height={h/2}/>
      {:else}
        <rect x="0" y="0" width="{valueLeft * w}" height={h}/>
    {/if}
    </g>
    </svg>
  </div>
</div>
