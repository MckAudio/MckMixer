<script>
  export let Handler = undefined;
  export let value = undefined;
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
</style>

<div
  class="main {value ? 'active' : ''}"
  on:click={() => {
    if (Handler) {
      Handler();
    }
  }}>
  <div />
  <div>
    <slot />
  </div>
  <div />
</div>
