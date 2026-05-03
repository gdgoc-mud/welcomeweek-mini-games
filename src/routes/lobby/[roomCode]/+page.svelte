<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { configStore } from '$lib/stores/config.js';
	import { setTheme } from '$lib/stores/theme.js';

	const roomCode = $page.params.roomCode;
	let eventSource;
	let roomState = null;
	let countdown = null;
	
	$: session = $sessionStore;
	$: isHost = session.isHost;
	$: amIReady = isHost ? roomState?.host?.ready : roomState?.guest?.ready;
	$: opponentReady = isHost ? roomState?.guest?.ready : roomState?.host?.ready;
	$: bothJoined = roomState?.host && roomState?.guest;

	onMount(() => {
		setTheme('grid', 'bg-white');

		if (!session.name || session.roomCode !== roomCode) {
			goto('/');
			return;
		}

		eventSource = new EventSource(`/api/room/${roomCode}/events`);
		
		eventSource.addEventListener('sync', (e) => {
			roomState = JSON.parse(e.data);
		});
		
		eventSource.addEventListener('start', (e) => {
			const data = JSON.parse(e.data);
			startCountdown(data.countdown);
		});
	});

	onDestroy(() => {
		if (eventSource) eventSource.close();
	});

	async function toggleReady() {
		await fetch(`/api/room/${roomCode}/ready`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isHost })
		});
	}

	function startCountdown(seconds) {
		countdown = seconds;
		setTheme('solid', 'bg-blue'); // Change theme on countdown
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				sessionStore.updateSession({
					opponentName: isHost ? roomState.guest.name : roomState.host.name
				});
				goto(`/play/${roomState.mode}`);
			}
		}, 1000);
	}
</script>

<div class="lobby-container">
	{#if countdown !== null}
		<div class="countdown-overlay">
			<div class="count">{countdown}</div>
		</div>
	{:else}
		<div class="header">
			<h1>ROOM CODE</h1>
			<div class="code">{roomCode}</div>
			<div class="ip-info">TELL YOUR OPPONENT TO GO TO:<br><strong>http://{$configStore.hostIp}:3000</strong></div>
		</div>

		<div class="players">
			<div class="neo-card player-card {amIReady ? 'bg-green' : 'bg-white'}">
				<div class="name">{roomState?.host?.name || 'WAITING...'}</div>
				<div class="role">HOST</div>
				{#if roomState?.host?.ready}
					<div class="ready-badge bg-green">READY</div>
				{/if}
			</div>

			<div class="vs">VS</div>

			<div class="neo-card player-card {opponentReady ? 'bg-green' : 'bg-white'} {!roomState?.guest ? 'waiting' : ''}">
				<div class="name">{roomState?.guest?.name || 'WAITING FOR OPPONENT...'}</div>
				<div class="role">GUEST</div>
				{#if roomState?.guest?.ready}
					<div class="ready-badge bg-green">READY</div>
				{/if}
			</div>
		</div>

		{#if bothJoined}
			<div class="action-area">
				<button 
					class="neo-btn {amIReady ? 'bg-yellow' : 'bg-blue text-white'}"
					on:click={toggleReady} 
					disabled={amIReady}
				>
					{amIReady ? 'WAITING FOR OPPONENT...' : 'READY UP!'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.lobby-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 40px 24px;
	}

	.header {
		text-align: center;
		margin-bottom: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		color: #000;
		margin: 0 0 16px 0;
		font-size: 3rem;
		text-shadow: 2px 2px 0px #fff;
	}

	.code {
		font-family: var(--font-mono);
		font-size: 64px;
		font-weight: bold;
		letter-spacing: 8px;
		background: var(--md-sys-color-tertiary);
		padding: 16px 32px;
		color: #000;
		border: var(--neo-border);
		box-shadow: var(--neo-shadow);
	}

	.ip-info {
		margin-top: 24px;
		color: #000;
		font-family: var(--font-mono);
		line-height: 1.5;
		font-size: 1.2rem;
		background: #fff;
		padding: 8px 16px;
		border: 2px solid #000;
	}

	.players {
		display: flex;
		align-items: center;
		gap: 40px;
		margin-bottom: 48px;
	}

	.player-card {
		padding: 32px;
		width: 280px;
		text-align: center;
		position: relative;
		transition: all 0.3s ease;
	}

	.player-card.waiting {
		border-style: dashed;
		opacity: 0.8;
		animation: pulse 2s infinite;
	}

	.bg-white { background-color: #fff; color: #000; }
	.bg-green { background-color: var(--md-sys-color-secondary); color: #fff; }
	.bg-blue { background-color: var(--md-sys-color-primary); color: #fff; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary); color: #000; }
	.text-white { color: #fff !important; }

	.name {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 8px;
		text-transform: uppercase;
		font-family: 'Google Sans Display', sans-serif;
	}

	.role {
		font-weight: bold;
		font-size: 14px;
		letter-spacing: 2px;
	}

	.ready-badge {
		position: absolute;
		top: -16px;
		right: -16px;
		color: white;
		padding: 8px 16px;
		font-weight: bold;
		font-size: 16px;
		transform: rotate(10deg);
		border: var(--neo-border);
		box-shadow: 2px 2px 0px #000;
	}

	.vs {
		font-family: 'Google Sans Display';
		font-size: 48px;
		font-weight: bold;
		color: #000;
		text-shadow: 4px 4px 0px #fff;
	}

	.action-area {
		margin-top: 32px;
	}

	.countdown-overlay {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 200px;
		color: #000;
		text-shadow: 12px 12px 0px #fff;
		animation: popIn 1s infinite;
	}

	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(0.95); }
		100% { transform: scale(1); }
	}

	@keyframes popIn {
		0% { transform: scale(0.5); opacity: 0; }
		20% { transform: scale(1.2); opacity: 1; }
		80% { transform: scale(1); opacity: 1; }
		100% { transform: scale(0.5); opacity: 0; }
	}
</style>
