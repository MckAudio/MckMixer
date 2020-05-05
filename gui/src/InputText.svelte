<script>
    export let value = "";
    export let Handler = undefined;

    function KeyHandler(_e) {
        if (_e.key === "Enter") {
            _e.target.blur();
        }
    }
</script>

<style>
    div {
        width: calc(100% - 10px);
        height: calc(100% - 10px);
        border: 1px solid var(--border-color);
        border-radius: 2px;
        padding: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: nowrap;
        color: var(--fg-color);
        background-color: var(--bg-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
        box-shadow: 0px 1px 2px 0px #555;
    }
    div:hover {
        background-color: var(--hover-color);
        color: var(--bg-color);
    }
</style>

<div contenteditable="true" spellcheck="false" on:keydown={KeyHandler} on:blur={_e => {
    if (Handler) {
        console.log('Div Change', _e);
        Handler(_e.target.innerText);
    }
}}>{value}</div>