<script>
  export let Handler = undefined;
  export let value = undefined;
  export let disabled = false;
</script>

<style>
  .main {
    background-color: #f0f0f0;
    color: #222;
    border: 1px solid #222;
    border-radius: 2px;
    width: calc(100% - 10px);
    height: calc(100% - 10px);
    padding: 4px;
    cursor: pointer;
    font-family: mck-lato;
    font-size: 14px;

    text-align: center;
    box-shadow: 0px 1px 2px 0px #555;
  }
  .main.active,
  .main:hover {
    background-color: #666;
    color: #f9f9f9;
  }
  .main.disabled {
    cursor: not-allowed;
    background-color: #999;
    color: #555;
  }
</style>

<div
  class="main {value ? 'active' : ''} {disabled ? 'disabled' : ''}"
  on:click={() => {
    if (Handler && disabled == false) {
      Handler();
    }
  }}>
  <div />
  <div>
    <slot />
  </div>
  <div />
</div>
