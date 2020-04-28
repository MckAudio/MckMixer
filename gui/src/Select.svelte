<script>
  import { GetOffsetLeft, GetOffsetTop } from "./Tools.svelte";
  import { onMount, onDestroy } from "svelte";

  export let items = [];
  export let value = undefined;
  export let numeric = true;
  export let Opener = undefined;
  export let Handler = undefined;
  export let Formatter = undefined;

  let show = false;
  let pos = [0.0, 0.0];

  function OpenSelect(_e) {
    console.log(_e);
    pos[0] = GetOffsetLeft(_e.target);
    pos[1] = GetOffsetTop(_e.target) + _e.target.offsetHeight;
    console.log(pos);
    show = !show;
    if (show && Opener) {
      Opener();
    }
  }
</script>

<style>
  .opener,
  .select {
    font-size: 14px;
    font-family: mck-lato;
    line-height: 20px;
    text-align: center;
  }
  .opener {
      background-color: #f0f0f0;
    border-radius: 2px;
    border: 1px solid #222;
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .opener:hover {
    background-color: #666;
    color: #f0f0f0;
  }
  .select {
    position: fixed;
    padding: 4px;
    display: grid;
    grid-auto-flow: row;
    background-color: #333;
    color: #f0f0f0;
    grid-row-gap: 4px;
    row-gap: 4px;
    z-index: 20;
  }
  .select > div:hover {
    background-color: #666;
    user-select: none;
    cursor: pointer;
  }
</style>

<div class="opener" on:click={OpenSelect}>
  {#if value === undefined || value === ''}
    <i>Select</i>
  {:else if numeric}
    {#if Formatter}{Formatter(items[value])}{:else}{items[value]}{/if}
  {:else if Formatter}{Formatter(value)}{:else}{value}{/if}
</div>
{#if show}
  <div class="select" style="left: {pos[0]}px; top: {pos[1]}px;">
    {#each items as item, i}
      <div
        on:click={() => {
          if (numeric) {
            Handler(i);
          } else {
            Handler(item);
          }
          show = false;
        }}>
        {item}
      </div>
    {/each}
  </div>
{/if}
