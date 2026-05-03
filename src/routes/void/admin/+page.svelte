<script>
	import { onMount } from 'svelte';
	
	let leaderboard = [];
	let loading = true;
	
	async function loadBoard() {
		try {
			const res = await fetch('/api/leaderboard');
			leaderboard = await res.json();
		} catch (e) {}
		loading = false;
	}

	onMount(loadBoard);

	async function deleteRow(id) {
		if (confirm('Delete this entry?')) {
			await fetch(`/api/leaderboard?id=${id}`, { method: 'DELETE' });
			loadBoard();
		}
	}

	async function clearAll() {
		if (confirm('Are you sure you want to clear the entire leaderboard? This cannot be undone!')) {
			await fetch('/api/leaderboard', { method: 'DELETE' });
			loadBoard();
		}
	}
</script>

<div class="admin-container">
	<div class="header">
		<h1>void/admin</h1>
		<div class="actions">
			<md-outlined-button href="/api/leaderboard/export" target="_blank">Export JSON</md-outlined-button>
			<md-filled-button on:click={clearAll} class="danger">Clear All Scores</md-filled-button>
			<md-text-button href="/">Exit</md-text-button>
		</div>
	</div>

	{#if loading}
		<div>Loading...</div>
	{:else}
		<table class="table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Mode</th>
					<th>Players</th>
					<th>Score</th>
					<th>Time</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each leaderboard as entry}
					<tr>
						<td>{entry.name} {#if entry.opponent}vs {entry.opponent}{/if}</td>
						<td><span class="chip {entry.mode}">{entry.mode}</span></td>
						<td>{entry.playerCount}P</td>
						<td class="score">{entry.score}</td>
						<td>{new Date(entry.timestamp).toLocaleString()}</td>
						<td>
							<button class="del-btn" on:click={() => deleteRow(entry.id)}>Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.admin-container {
		padding: 40px;
		max-width: 1000px;
		margin: 0 auto;
		color: var(--md-sys-color-on-surface);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	h1 {
		color: var(--md-sys-color-error);
		font-family: var(--font-mono);
	}

	.actions {
		display: flex;
		gap: 16px;
	}

	/* Force error styling on md3 button */
	:global(.danger) {
		--md-sys-color-primary: var(--md-sys-color-error);
		--md-sys-color-on-primary: #fff;
	}

	.table {
		width: 100%;
		border-collapse: collapse;
		background-color: var(--md-sys-color-surface);
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--md-sys-color-outline);
	}

	th, td {
		padding: 16px;
		text-align: left;
		border-bottom: 1px solid var(--md-sys-color-outline);
	}

	th {
		color: var(--md-sys-color-on-surface);
		font-weight: normal;
		text-transform: uppercase;
		font-size: 12px;
		letter-spacing: 1px;
	}

	.chip {
		padding: 4px 8px;
		border-radius: 8px;
		font-size: 12px;
		text-transform: uppercase;
		font-weight: bold;
	}

	.trivia { color: #4285F4; background: rgba(66, 133, 244, 0.2); }
	.debug { color: #34A853; background: rgba(52, 168, 83, 0.2); }

	.score {
		font-family: var(--font-mono);
		font-weight: bold;
	}

	.del-btn {
		background: none;
		border: 1px solid #EA4335;
		color: #EA4335;
		padding: 4px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	.del-btn:hover {
		background: rgba(234, 67, 53, 0.2);
	}
</style>
