<script>
	export let code = '';
</script>

<div class="code-block">
	<div class="line-numbers">
		{#each code.split('\n') as _, i}
			<div class="line-number">{i + 1}</div>
		{/each}
	</div>
	<pre><code>{code}</code></pre>
</div>

<style>
	.code-block {
		display: flex;
		background-color: #F8F9FA;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--md-sys-color-outline);
		font-family: var(--font-mono);
		font-size: 16px;
		line-height: 1.5;
	}

	.line-numbers {
		padding: 16px 12px;
		background-color: #F1F3F4;
		color: #5F6368;
		text-align: right;
		user-select: none;
		border-right: 1px solid #DADCE0;
	}

	pre {
		margin: 0;
		padding: 16px;
		overflow-x: auto;
		color: #202124;
	}

	code {
		font-family: inherit;
	}
</style>
