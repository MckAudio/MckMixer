<script>
  import { onMount, onDestroy } from "svelte";
  import { GetOffsetLeft, GetOffsetTop } from "./Tools.svelte";

  export let vertical = false;
  export let Handler = undefined;
  export let value = 0.0;

  let curValue = -1.0;
  let curWidth = 100.0;
  let curHeight = 100.0;
  let base = undefined;

  let offset = 0.0;
  let mouse = 0.0;
  let elemWidth = 0.0;
  let elemHeight = 0.0;
  let isDragging = false;

  $: if (value != curValue) {
    curValue = Math.max(0.0, Math.min(1.0, value));
    if (vertical) {
      curHeight = Math.round(curValue * 100.0);
    } else {
      curWidth = Math.round(curValue * 100.0);
    }
    //slider.style.width = `${Math.round(curValue * 100.0)}$`;
  }

  function TouchHandler(_evt) {
        console.log("[TOUCH]", _evt);
    if (_evt.type == "touchstart") {
      if (base) {
        isDragging = true;
        elemWidth = base.offsetWidth;
        elemHeight = base.offsetHeight;
        let _val = curValue;
        if (vertical) {
          offset = GetOffsetTop(base);
          _val =
            1.0 - Math.max(0.0, Math.min(1.0, (_evt.touches[0].clientY - offset) / elemHeight));
        } else {
          offset = GetOffsetLeft(base);
          _val = Math.max(0.0, Math.min(1.0, (_evt.touches[0].clientX - offset) / elemWidth));
        }
        if (Handler) {
          Handler(_val);
        }
        //_evt.preventDefault();
      }
    } else if (_evt.type == "touchmove") {
      if (isDragging) {
        let _val = curValue;
        if (vertical) {
          offset = GetOffsetTop(base);
          _val =
            1.0 - Math.max(0.0, Math.min(1.0, (_evt.touches[0].clientY - offset) / elemHeight));
        } else {
          offset = GetOffsetLeft(base);
          _val = Math.max(0.0, Math.min(1.0, (_evt.touches[0].clientX - offset) / elemWidth));
        }
        if (Handler) {
          Handler(_val);
        }

        _evt.stopImmediatePropagation();
      }
    } else if (_evt.type == "touchend") {
      if (isDragging) {
        isDragging = false;
        //_evt.preventDefault();
      }
    }
  }

  function MouseHandler(_evt) {
    if (_evt.type == "mousedown") {
      if (base) {
        isDragging = true;
        elemWidth = base.offsetWidth;
        elemHeight = base.offsetHeight;
        let _val = curValue;
        if (vertical) {
          offset = GetOffsetTop(base);
          _val =
            1.0 - Math.max(0.0, Math.min(1.0, (_evt.y - offset) / elemHeight));
        } else {
          offset = GetOffsetLeft(base);
          _val = Math.max(0.0, Math.min(1.0, (_evt.x - offset) / elemWidth));
        }
        if (Handler) {
          Handler(_val);
        }
        _evt.preventDefault();
      }
    } else if (_evt.type == "mousemove") {
      if (isDragging) {
        let _val = curValue;
        if (vertical) {
          offset = GetOffsetTop(base);
          _val =
            1.0 - Math.max(0.0, Math.min(1.0, (_evt.y - offset) / elemHeight));
        } else {
          offset = GetOffsetLeft(base);
          _val = Math.max(0.0, Math.min(1.0, (_evt.x - offset) / elemWidth));
        }
        if (Handler) {
          Handler(_val);
        }

        _evt.preventDefault();
      }
    } else if (_evt.type == "mouseup") {
      if (isDragging) {
        isDragging = false;
        _evt.preventDefault();
      }
    }
  }

  onMount(() => {
      window.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("mousemove", MouseHandler);
    document.addEventListener("mouseup", MouseHandler);
    document.addEventListener("touchmove", TouchHandler);
    document.addEventListener("touchend", TouchHandler);
  });

  onDestroy(() => {
    document.removeEventListener("mousemove", MouseHandler);
    document.removeEventListener("mouseup", MouseHandler);
    document.removeEventListener("touchmove", TouchHandler);
    document.removeEventListener("touchend", TouchHandler);
  });
</script>

<style>
  .base {
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    border: 1px solid #222;
    border-radius: 2px;
    cursor: pointer;
  }

  .slider.hori {
    min-height: 20px;
    height: 100%;
    width: 50%;
    background-image: linear-gradient(90deg, #666, #222);
  }
  .slider.vert {
    min-width: 20px;
    position: relative;
    top: 50%;
    height: 50%;
    width: 100%;
    background-image: linear-gradient(0deg, #666, #222);
  }
  .slider {
      z-index: 4;
      position: absolute;
      background-image: none;
      background: #f005;
  }
  span {
      position: absolute;
  }
</style>

<div class="base" bind:this={base} on:mousedown={MouseHandler} on:touchstart={TouchHandler}>
  {#if vertical}
    <div
      class="slider vert"
      style="top: {100 - curHeight}%; height: {curHeight}%" />
  {:else}
    <div class="slider hori" style="width: {curWidth}%;" />
    <span>{curWidth}</span>
  {/if}
</div>
