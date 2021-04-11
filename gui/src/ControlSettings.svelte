<script>
    import Button from "./mck/controls/Button.svelte";
    import InputNumber from "./mck/controls/InputNumber.svelte";

    export let data = undefined;
    export let SendMsg = undefined;

    let dataReady = false;
    $: dataReady = data !== undefined && data.hasOwnProperty("activeChannel");

    function SendCtrlCmd(_idx, _cmd) {
        let _data = JSON.stringify({
            cmd: _cmd,
            type: _idx,
        });
        if (SendMsg) {
            SendMsg("command", "control", _data);
        }
    }
</script>

<div class="base">
    {#if dataReady}
            <div class="table">
                <div />
                <i>Active:</i>
                <i>Channel:</i>
                <i>Ctrl:</i>
                <i>Type:</i>
                <i>Actions:</i>
                {#each data.controls as control, i}
                    <div class="name">{data.names[i]}:</div>
                    <Button value={control.set}>Set</Button>
                    <InputNumber value={control.chan}/>
                    <InputNumber value={control.head}/>
                    <InputNumber value={control.data}/>
                    <div class="gridder">
                        <Button
                            disabled={control.learn}
                            Handler={() => SendCtrlCmd(i, 1)}>Learn</Button
                        >
                        <Button
                            disabled={control.learn === false}
                            Handler={() => SendCtrlCmd(i, 2)}>Stop</Button
                        >
                        <Button
                            disabled={control.learn}
                            Handler={() => SendCtrlCmd(i, 3)}>Clear</Button
                        >
                    </div>
                {/each}
            </div>
    {/if}
</div>

<style>
    .base {
        padding: 8px;
        display: grid;
        grid-auto-rows: auto;
        row-gap: 4px;
        grid-row-gap: 4px;
    }
    i,
    span,
    b,
    div {
        font-size: 14px;
        font-family: var(--font-family);
        color: var(--font-size);
    }
    .name {
        font-style: italic;
        text-align: right;
        white-space: nowrap;
        line-height: 27px;
    }
    .control {
        display: grid;
        grid-template-rows: auto minmax(24px, auto);
        grid-row-gap: 2px;
        row-gap: 2px;
        font-size: 14px;
    }
    .splitter {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 2px;
        column-gap: 2px;
    }
    .gridder {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: min-content;
        column-gap: 2px;
    }
    .table {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(6, min-content);
        grid-auto-rows: auto;
        grid-gap: 8px;
    }
</style>
