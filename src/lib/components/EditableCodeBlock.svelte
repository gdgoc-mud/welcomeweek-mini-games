<script>
	export let code = '';
	export let disabled = false;

	let textareaRef;
	let lines = [];

	$: lines = code.split('\n');

	function handleInput(e) {
		code = e.target.value;
	}

	function handleKeydown(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const start = textareaRef.selectionStart;
			const end = textareaRef.selectionEnd;

			code = code.substring(0, start) + '    ' + code.substring(end);
			
			// Wait for Svelte to update the DOM, then restore cursor
			setTimeout(() => {
				textareaRef.selectionStart = textareaRef.selectionEnd = start + 4;
			}, 0);
		}
	}
</script>

<div class="code-editor" class:disabled>
	<div class="line-numbers">
		{#each lines as _, i}
			<div class="line-number">{i + 1}</div>
		{/each}
	</div>
	<textarea
		bind:this={textareaRef}
		value={code}
		on:input={handleInput}
		on:keydown={handleKeydown}
		{disabled}
		spellcheck="false"
	></textarea>
</div>

<style>
	.code-editor {
		display: flex;
		background-color: #1e1e1e;
		border-radius: 8px;
		overflow: hidden;
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
		font-family: var(--font-mono);
		font-size: 16px;
		line-height: 1.5;
		position: relative;
		min-height: 200px;
	}

	.code-editor.disabled {
		opacity: 0.8;
		pointer-events: none;
	}

	.line-numbers {
		padding: 16px 12px;
		background-color: #252526;
		color: #858585;
		text-align: right;
		user-select: none;
		border-right: 1px solid #333;
		min-width: 40px;
	}

	textarea {
		flex: 1;
		margin: 0;
		padding: 16px;
		background: transparent;
		color: #d4d4d4;
		border: none;
		outline: none;
		resize: none;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		white-space: pre;
		overflow-x: auto;
		overflow-y: auto;
	}

	/* Scrollbar styling for a nicer look */
	textarea::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}
	textarea::-webkit-scrollbar-track {
		background: #1e1e1e;
	}
	textarea::-webkit-scrollbar-thumb {
		background: #424242;
		border-radius: 4px;
	}
</style>
