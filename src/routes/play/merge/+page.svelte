<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { setTheme } from '$lib/stores/theme.js';
	
	$: session = $sessionStore;
	let eventSource;
	let grid = Array(36).fill(0);
	let timeLeft = 45;
	let timer;
	
	let hostTiles = 0;
	let guestTiles = 0;
	let hostName = 'HOST';
	let guestName = 'GUEST';
	let showTutorial = true;
	let iAmReady = false;
	let gameStarted = false;

	onMount(() => {
		setTheme('grid', 'bg-white');
		if (!session.roomCode) { goto('/'); return; }
		
		eventSource = new EventSource(`/api/room/${session.roomCode}/events`);
		eventSource.addEventListener('sync', (e) => {
			const state = JSON.parse(e.data);
			if (state.host) hostName = state.host.name;
			if (state.guest) guestName = state.guest.name;
			
			if (state.gameState) {
				if (state.gameState.grid) {
					grid = state.gameState.grid;
					hostTiles = grid.filter(v => v === 1).length;
					guestTiles = grid.filter(v => v === 2).length;
					
					sessionStore.updateSession({ 
						score: session.isHost ? hostTiles * 100 : guestTiles * 100,
						opponentScore: session.isHost ? guestTiles * 100 : hostTiles * 100
					});
				}
				
				if (state.gameState.started && !gameStarted) {
					gameStarted = true;
					showTutorial = false;
					startGameTimer();
				}
			}
		});
		eventSource.addEventListener('game_over', () => { goto('/gg'); });
	});

	function startGameTimer() {
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
				if (timeLeft <= 0) {
					clearInterval(timer);
					finishGame();
				}
			}
		}, 1000);
	}

	onDestroy(() => {
		clearInterval(timer);
		if (eventSource) eventSource.close();
	});

	async function finishGame() {
		const finalScore = session.isHost ? hostTiles * 100 : guestTiles * 100;
		sessionStore.updateSession({ score: finalScore });
		
		await fetch(`/api/room/${session.roomCode}/update`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost: session.isHost, finished: true, score: finalScore })
		});
	}

	async function setReady() {
		iAmReady = true;
		await fetch(`/api/room/${session.roomCode}/action`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost: session.isHost, action: 'ready', payload: {} })
		});
	}

	async function handleClick(index) {
		if (timeLeft <= 0 || !gameStarted) return;
		await fetch(`/api/room/${session.roomCode}/action`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost: session.isHost, action: 'click', payload: { index } })
		});
	}
</script>

{#if showTutorial}
<div class="tutorial-overlay">
	<div class="tutorial-card neo-card bg-yellow">
		<h2>HOW TO PLAY</h2>
		<p>Click on tiles to claim them for your network! You can instantly steal your opponent's tiles.</p>
		<div class="direction">
			{#if session.isHost}
				<span class="text-blue">👉 YOUR COLOR: BLUE</span>
			{:else}
				<span class="text-red">👈 YOUR COLOR: RED</span>
			{/if}
		</div>
		<button 
			class="neo-btn bg-white" 
			style="margin-top: 32px; width: 100%;"
			on:click={setReady}
			disabled={iAmReady}
		>
			{iAmReady ? 'WAITING FOR OPPONENT...' : 'I AM READY'}
		</button>
	</div>
</div>
{/if}

<div class="merge-container">
	<div class="scoreboard">
		<div class="score host-score bg-blue text-white">
			{hostName.toUpperCase()} {#if session.isHost}<span class="you-badge">(YOU)</span>{/if}: {hostTiles}
		</div>
		<div class="timer bg-yellow">{timeLeft}s</div>
		<div class="score guest-score bg-red text-white">
			{#if !session.isHost}<span class="you-badge">(YOU)</span>{/if} {guestName.toUpperCase()}: {guestTiles}
		</div>
	</div>

	<div class="grid-container">
		{#each grid as val, i}
			<button 
				class="tile neo-btn {val === 1 ? 'bg-blue' : val === 2 ? 'bg-red' : 'bg-white'}" 
				on:click={() => handleClick(i)}
			>
			</button>
		{/each}
	</div>
</div>

<style>
	.merge-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px;
		height: 100vh;
	}
	.scoreboard {
		display: flex;
		gap: 32px;
		margin-bottom: 40px;
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: bold;
	}
	.score, .timer {
		padding: 16px 32px;
		border: var(--neo-border);
		box-shadow: var(--neo-shadow);
	}
	.grid-container {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 16px;
		background: #000;
		padding: 16px;
		box-shadow: 16px 16px 0px rgba(0,0,0,0.5);
	}
	.tile {
		width: 80px;
		height: 80px;
		font-size: 2rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.05s, background-color 0.1s;
	}
	.tile:active {
		transform: scale(0.9);
	}
	.bg-white { background-color: #fff; }
	.bg-blue { background-color: var(--md-sys-color-primary); color: #fff; }
	.bg-red { background-color: var(--md-sys-color-error); color: #fff; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary); }
	
	.you-badge {
		font-size: 0.6em;
		opacity: 0.8;
		vertical-align: middle;
	}
	
	.tutorial-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}
	
	.tutorial-card {
		padding: 40px;
		text-align: center;
		max-width: 600px;
		animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	.tutorial-card h2 { margin: 0 0 16px 0; font-size: 2.5rem; font-family: 'Google Sans Display'; }
	.tutorial-card p { font-size: 1.5rem; margin-bottom: 32px; font-weight: bold; font-family: var(--font-mono); }
	
	.direction { 
		font-size: 1.5rem; 
		font-weight: bold; 
		font-family: var(--font-mono); 
		background: #fff; 
		padding: 16px; 
		border: var(--neo-border); 
	}

	@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>