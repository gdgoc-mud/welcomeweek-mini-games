<script>
	import { onMount, onDestroy } from 'svelte';
	import LeaderboardRow from '$lib/components/LeaderboardRow.svelte';
	import { goto } from '$app/navigation';

	let activeTab = 'trivia';
	let leaderboardData = [];
	let timer;

	async function fetchLeaderboard() {
		try {
			const res = await fetch('/api/leaderboard');
			if (res.ok) {
				leaderboardData = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch leaderboard');
		}
	}

	onMount(() => {
		fetchLeaderboard();
		timer = setInterval(fetchLeaderboard, 8000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	$: filteredData = leaderboardData.filter(d => d.mode === activeTab);
</script>

<div class="leaderboard-container">
	<div class="header">
		<h1>LEADERBOARD</h1>
		<div class="neo-toggle tabs">
			<button class="toggle-btn {activeTab === 'trivia' ? 'active bg-blue text-white' : 'bg-white'}" on:click={() => activeTab = 'trivia'}>TRIVIA</button>
			<button class="toggle-btn {activeTab === 'debug' ? 'active bg-yellow' : 'bg-white'}" on:click={() => activeTab = 'debug'}>DEBUG</button>
			<button class="toggle-btn {activeTab === 'merge' ? 'active bg-red text-white' : 'bg-white'}" on:click={() => activeTab = 'merge'}>MERGE</button>
			<button class="toggle-btn {activeTab === 'bug' ? 'active bg-green text-white' : 'bg-white'}" on:click={() => activeTab = 'bug'}>BUG</button>
			<button class="toggle-btn {activeTab === 'ddos' ? 'active bg-black text-white' : 'bg-white'}" on:click={() => activeTab = 'ddos'}>DDOS</button>
		</div>
	</div>

	<div class="board">
		{#each filteredData as entry, i (entry.id)}
			<LeaderboardRow {entry} rank={i + 1} />
		{:else}
			<div class="empty neo-card bg-white">NO SCORES YET. BE THE FIRST!</div>
		{/each}
	</div>
	
	<div class="actions">
		<button class="neo-btn bg-white" on:click={() => goto('/')}>BACK HOME</button>
	</div>
</div>

<style>
	.leaderboard-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 24px;
		min-height: 100vh;
	}

	.header {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		color: #000;
		margin: 0 0 24px 0;
		font-size: 3rem;
		text-shadow: 4px 4px 0px #fff;
	}

	.neo-toggle {
		display: inline-flex;
		border: var(--neo-border);
		background: #fff;
		box-shadow: var(--neo-shadow);
	}

	.toggle-btn {
		padding: 16px 32px;
		border: none;
		background: transparent;
		font-family: 'Google Sans Display', sans-serif;
		font-weight: 700;
		font-size: 1.2rem;
		cursor: pointer;
		text-transform: uppercase;
		transition: background 0.2s, color 0.2s;
	}

	.toggle-btn:not(:last-child) {
		border-right: var(--neo-border);
	}

	.toggle-btn.active {
		box-shadow: inset 4px 4px 0px rgba(0,0,0,0.2);
		text-shadow: 2px 2px 0px #000;
	}
	
	.active.bg-yellow { color: #fff; text-shadow: 2px 2px 0px #000; }
	.active.bg-blue { text-shadow: 2px 2px 0px #000; }
	.active.bg-red { text-shadow: 2px 2px 0px #000; }
	.active.bg-green { text-shadow: 2px 2px 0px #000; }
	.active.bg-black { text-shadow: 2px 2px 0px #000; }

	.bg-blue { background-color: var(--md-sys-color-primary); }
	.bg-yellow { background-color: var(--md-sys-color-tertiary); }
	.bg-red { background-color: var(--md-sys-color-error); }
	.bg-green { background-color: #0a0; }
	.bg-black { background-color: #111; }
	.bg-white { background-color: #fff; }
	.text-white { color: #fff; }

	.board {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 40px;
	}

	.empty {
		text-align: center;
		padding: 48px;
		font-weight: bold;
		font-size: 1.2rem;
	}

	.actions {
		display: flex;
		justify-content: center;
	}
</style>
