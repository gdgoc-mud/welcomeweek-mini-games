<script>
	export let entry;
	export let rank;
</script>

<div class="row neo-card bg-white" class:top3={rank <= 3}>
	<div class="rank">
		{#if rank === 1}🥇
		{:else if rank === 2}🥈
		{:else if rank === 3}🥉
		{:else}#{rank}{/if}
	</div>
	
	<div class="details">
		<div class="name">{entry.name}</div>
		{#if entry.playerCount === 2}
			<div class="match-info">
				<span class="vs">vs {entry.opponent}</span>
			</div>
		{:else}
			<div class="match-info">
				<span class="mode-badge bg-blue">Solo</span>
			</div>
		{/if}
	</div>

	<div class="score">{entry.score}</div>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		padding: 16px 24px;
		gap: 24px;
		transition: transform 0.2s;
	}

	.row:hover {
		transform: translateX(8px);
	}

	.top3 {
		border-width: 6px;
	}

	.rank {
		font-size: 32px;
		font-weight: bold;
		min-width: 48px;
		text-align: center;
	}

	.details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.name {
		font-size: 20px;
		font-weight: bold;
		font-family: 'Google Sans Display', sans-serif;
		text-transform: uppercase;
	}

	.match-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.mode-badge {
		font-size: 12px;
		padding: 4px 8px;
		border: 2px solid #000;
		font-weight: bold;
		text-transform: uppercase;
		color: #fff;
	}

	.bg-blue { background-color: var(--md-sys-color-primary); }

	.vs {
		font-size: 14px;
		color: #000;
		font-weight: bold;
	}

	.score {
		font-family: var(--font-mono);
		font-size: 32px;
		font-weight: bold;
		background: var(--md-sys-color-tertiary);
		padding: 8px 16px;
		border: 4px solid #000;
	}
	
	.bg-white { background-color: #fff; }
</style>

