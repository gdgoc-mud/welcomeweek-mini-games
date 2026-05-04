<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { setTheme } from '$lib/stores/theme.js';
	
	$: session = $sessionStore;
	let eventSource;
	let bugs = [];
	let hostScore = 0;
	let guestScore = 0;
	let hostName = 'HOST';
	let guestName = 'GUEST';
	
	let timeLeft = 60;
	let gameTimer;
	let spawnTimer;
	
	let showTutorial = true;
	let iAmReady = false;
	let gameStarted = false;

	const BUG_SVGS = [
		// Pixel Beetle
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" fill="currentColor"><path d="M6 1h4v1H6V1zM4 2h8v1H4V2zM3 3h10v1H3V3zM2 4h12v1H2V4zM2 5h12v1H2V5zM1 6h14v1H1V6zM1 7h14v1H1V7zM1 8h14v1H1V8zM1 9h14v1H1V9zM2 10h12v1H2v-1zM2 11h12v1H2v-1zM3 12h10v1H3v-1zM4 13h8v1H4v-1zM6 14h4v1H6v-1z M7 2v13h2V2H7z M3 5v4h1V5H3z M12 5v4h1V5h-1z"/></svg>`,
		// Pixel Spider
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" fill="currentColor"><path d="M0 2h2v2h2v2h2v2h4V6h2V4h2V2h2v2h-2v2h-2v2h-2v4h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2H6v2H4v2H2v2H0v-2h2v-2h2v-2H2V8H0V6h2V4H0V2zM6 8h4v2H6V8z"/></svg>`,
		// Pixel Ant/Fly
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" shape-rendering="crispEdges" fill="currentColor"><path d="M7 0h2v2H7V0z M6 2h4v2H6V2z M5 4h6v2H5V4z M4 6h8v2H4V6z M3 8h10v2H3V8z M4 10h8v2H4v-2z M6 12h4v2H6v-2z M7 14h2v2H7v-2z M1 5h2v2H1V5z M13 5h2v2h-2V5z"/></svg>`
	];

	onMount(() => {
		setTheme('dots', 'bg-white');
		if (!session.roomCode) { goto('/'); return; }
		
		eventSource = new EventSource(`/api/room/${session.roomCode}/events`);
		eventSource.addEventListener('sync', (e) => {
			const state = JSON.parse(e.data);
			if (state.host) hostName = state.host.name;
			if (state.guest) guestName = state.guest.name;
			
			if (state.gameState) {
				if (state.gameState.bugs) {
					bugs = state.gameState.bugs;
				}
				if (state.host) hostScore = state.host.score || 0;
				if (state.guest) guestScore = state.guest.score || 0;
				
				sessionStore.updateSession({
					score: session.isHost ? hostScore : guestScore,
					opponentScore: session.isHost ? guestScore : hostScore
				});
				
				if (state.gameState.started && !gameStarted) {
					gameStarted = true;
					showTutorial = false;
					startGameTimer();
					startSpawning();
				}
			}
		});
		eventSource.addEventListener('game_over', () => { goto('/gg'); });
	});

	function startGameTimer() {
		gameTimer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
				if (timeLeft <= 0) {
					clearInterval(gameTimer);
					clearInterval(spawnTimer);
					finishGame();
				}
			}
		}, 1000);
	}

	function startSpawning() {
		// Host uniquely manages the bug spawning to prevent duplicate state issues
		if (session.isHost) {
			spawnTimer = setInterval(() => {
				if (timeLeft <= 0 || bugs.length > 15) return; // Don't overfill the screen
				
				const newBug = {
					id: Math.random().toString(36).substring(2, 9),
					x: Math.floor(Math.random() * 80) + 10, // 10% to 90%
					y: Math.floor(Math.random() * 80) + 10, // 10% to 90%
					size: Math.floor(Math.random() * 3) + 3, // 3rem to 5rem
					type: Math.floor(Math.random() * BUG_SVGS.length) // Bug visual type
				};

				fetch(`/api/room/${session.roomCode}/action`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ isHost: true, action: 'spawn', payload: newBug })
				});
			}, 800); // Spawn a bug every 800ms
		}
	}

	onDestroy(() => {
		clearInterval(gameTimer);
		clearInterval(spawnTimer);
		if (eventSource) eventSource.close();
	});

	async function finishGame() {
		const finalScore = session.isHost ? hostScore : guestScore;
		sessionStore.updateSession({ score: finalScore });
		
		await fetch(`/api/room/${session.roomCode}/update`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost: session.isHost, finished: true, score: finalScore })
		});
	}

	async function squash(id) {
		if (timeLeft <= 0 || !gameStarted) return;
		// Optimistically remove from UI
		bugs = bugs.filter(b => b.id !== id);
		
		await fetch(`/api/room/${session.roomCode}/action`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost: session.isHost, action: 'squash', payload: { id } })
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
</script>

{#if showTutorial}
<div class="tutorial-overlay">
	<div class="tutorial-card neo-card bg-yellow">
		<h2>HOW TO PLAY</h2>
		<p>Squash the system bugs as fast as you can before the time runs out!</p>
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

<div class="bug-container">
	<div class="scoreboard">
		<div class="score host-score bg-blue text-white neo-card">
			{hostName.toUpperCase()} {#if session.isHost}<span class="you-badge">(YOU)</span>{/if}: {hostScore}
		</div>
		<div class="timer bg-yellow neo-card">{timeLeft}s</div>
		<div class="score guest-score bg-red text-white neo-card">
			{#if !session.isHost}<span class="you-badge">(YOU)</span>{/if} {guestName.toUpperCase()}: {guestScore}
		</div>
	</div>

	<div class="play-area neo-card bg-black">
		{#if bugs.length === 0 && timeLeft > 0 && gameStarted}
			<div class="waiting-text">SYSTEM SECURE...</div>
		{/if}
		
		{#each bugs as bug (bug.id)}
			<button 
				class="bug-btn text-green" 
				style="left: {bug.x}%; top: {bug.y}%; width: {bug.size}rem; height: {bug.size}rem;"
				on:click|preventDefault={() => squash(bug.id)}
			>
				{@html BUG_SVGS[bug.type || 0]}
			</button>
		{/each}
	</div>
</div>

<style>
	.bug-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px;
		height: 100vh;
		gap: 32px;
	}

	.scoreboard {
		display: flex;
		gap: 32px;
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: bold;
		z-index: 10;
	}

	.score, .timer {
		padding: 16px 32px;
	}

	.play-area {
		flex-grow: 1;
		width: 100%;
		max-width: 1200px;
		position: relative;
		overflow: hidden;
		cursor: crosshair;
	}

	.waiting-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-mono);
		font-size: 2rem;
		color: #999;
		pointer-events: none;
	}

	.bug-btn {
		position: absolute;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: crosshair;
		transform: translate(-50%, -50%);
		transition: transform 0.1s;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.bug-btn:active {
		transform: translate(-50%, -50%) scale(0.7);
	}

	/* Prevent weird blue highlights on mobile/touch */
	.bug-btn:focus {
		outline: none;
	}
	
	.bg-white { background-color: #fff; }
	.bg-blue { background-color: var(--md-sys-color-primary); color: #fff; }
	.bg-red { background-color: var(--md-sys-color-error); color: #fff; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary); }
	.bg-black { background-color: #111; color: #fff; }
	.text-green { color: #0f0; filter: drop-shadow(0 0 8px #0f0); }
	
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
	
	@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>