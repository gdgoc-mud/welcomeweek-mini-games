<script>
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { themeStore, setTheme } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	
	let name = '';
	let mode = null; // nothing selected by default
	let joinCode = '';
	let isJoining = false;
	let loading = false;
	let error = '';

	const cyclePatterns = ['dots', 'grid', 'lines-h', 'lines-v', 'lines-diag'];
	let cycleIndex = 0;
	let cycleTimer;

	onMount(() => {
		sessionStore.resetSession();
		
		cycleTimer = setInterval(() => {
			if (!mode) {
				cycleIndex = (cycleIndex + 1) % cyclePatterns.length;
				setTheme(cyclePatterns[cycleIndex], 'bg-white');
			}
		}, 3000); // 3 second cycle for smooth transitions

		if (!mode) setTheme(cyclePatterns[0], 'bg-white');

		return () => {
			if (cycleTimer) clearInterval(cycleTimer);
		};
	});

	$: {
		if (mode === 'trivia') {
			setTheme('dots', 'bg-blue');
		} else if (mode === 'debug') {
			setTheme('grid', 'bg-yellow');
		} else if (mode === null) {
			setTheme(cyclePatterns[cycleIndex], 'bg-white');
		}
	}

	function validate() {
		error = '';
		if (!name) {
			error = 'Please enter your name';
			return false;
		}
		if (!mode && !isJoining) {
			error = 'Please select a game mode';
			return false;
		}
		return true;
	}

	async function playSolo() {
		if (!validate()) return;
		sessionStore.updateSession({ name, mode, roomCode: null, isHost: false, playerCount: 1, history: [] });
		goto(`/play/${mode}`);
	}

	async function createRoom() {
		if (!validate()) return;
		loading = true;
		try {
			const res = await fetch('/api/room/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, mode })
			});
			const data = await res.json();
			sessionStore.updateSession({ name, mode, roomCode: data.code, isHost: true, playerCount: 2, history: [] });
			goto(`/lobby/${data.code}`);
		} catch (err) {
			error = 'Failed to create room';
		} finally {
			loading = false;
		}
	}

	async function joinRoom() {
		if (!name) return error = 'Please enter your name';
		if (!joinCode) return error = 'Please enter a room code';
		loading = true;
		try {
			const code = joinCode.toUpperCase();
			const res = await fetch(`/api/room/${code}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			const data = await res.json();
			if (data.error) {
				error = data.error;
			} else {
				sessionStore.updateSession({ name, mode: data.mode, roomCode: code, isHost: false, playerCount: 2, history: [] });
				goto(`/lobby/${code}`);
			}
		} catch (err) {
			error = 'Failed to join room';
		} finally {
			loading = false;
		}
	}
</script>

<div class="landing-container">
	<div class="left-column">
		<img src="/logo.png" alt="GDGOC Logo" class="logo" />
		
		<div class="title-container">
			<h2>Google Developer Group on Campus<br>Murdoch University Dubai</h2>
			<h1 class="main-title">
				<span class="word mini">MINI</span>
				<span class="word games">GAMES</span>
			</h1>
		</div>
	</div>

	<div class="right-column">
		<div class="neo-card login-card">
			<input 
				type="text" 
				class="neo-input" 
				placeholder="YOUR NAME" 
				bind:value={name}
				maxlength="20"
			/>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			{#if !isJoining}
				<div class="selector-group">
					<h3>GAME MODE</h3>
					
					<div class="mode-category">QUIZ / PUZZLE (1P OR 2P)</div>
					<div class="neo-toggle">
						<button 
							class="toggle-btn {mode === 'trivia' ? 'active bg-blue text-white' : ''}" 
							on:click={() => mode = 'trivia'}
						>
							TRIVIA
						</button>
						<button 
							class="toggle-btn {mode === 'debug' ? 'active bg-yellow text-black' : ''}" 
							on:click={() => mode = 'debug'}
						>
							DEBUG
						</button>
					</div>

					<div class="mode-category" style="margin-top: 16px;">ARCADE (2P ONLY)</div>
					<div class="neo-toggle mini-toggle">
						<button class="toggle-btn {mode === 'merge' ? 'active bg-red text-white' : ''}" on:click={() => mode = 'merge'}>MERGE</button>
						<button class="toggle-btn {mode === 'ddos' ? 'active bg-green text-white' : ''}" on:click={() => mode = 'ddos'}>DDOS</button>
						<button class="toggle-btn {mode === 'bug' ? 'active bg-blue text-white' : ''}" on:click={() => mode = 'bug'}>BUG</button>
					</div>
				</div>

				<div class="action-buttons">
					{#if mode !== 'merge' && mode !== 'ddos' && mode !== 'bug'}
						<button class="neo-btn action-btn bg-white" on:click={playSolo} disabled={loading}>PLAY SOLO</button>
					{/if}
					<button class="neo-btn action-btn bg-white" on:click={createRoom} disabled={loading}>CREATE 2P ROOM</button>
				</div>
				
				<div class="join-link" on:click={() => isJoining = true} on:keydown={(e) => e.key === 'Enter' && (isJoining = true)} tabindex="0" role="button">
					HAVE A CODE? JOIN ROOM
				</div>
			{:else}
				<div class="join-section">
					<input 
						type="text" 
						class="neo-input code-input" 
						placeholder="ROOM CODE" 
						bind:value={joinCode}
					/>
					<div class="action-buttons">
						<button class="neo-btn action-btn bg-green text-white" on:click={joinRoom} disabled={loading}>JOIN ROOM</button>
						<button class="neo-btn action-btn bg-white" on:click={() => { isJoining = false; error = ''; }}>BACK</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.landing-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-evenly;
		min-height: 100vh;
		padding: 48px;
		gap: 64px;
		max-width: 1800px;
		margin: 0 auto;
	}

	.left-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		max-width: 800px;
	}

	.right-column {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 600px;
		width: 100%;
	}

	.logo {
		height: 180px;
		margin-bottom: 32px;
		filter: drop-shadow(6px 6px 0px #000);
		animation: float 6s ease-in-out infinite;
	}

	.title-container {
		text-align: left;
		margin-bottom: 0;
	}

	h2 {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		background: #000;
		color: #fff;
		padding: 16px 24px;
		display: inline-block;
		margin-bottom: 32px;
		border: var(--neo-border);
		box-shadow: 6px 6px 0px var(--md-sys-color-secondary);
		text-transform: uppercase;
		letter-spacing: 2px;
		line-height: 1.4;
	}

	.main-title {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 0.85;
		margin: 0;
	}

	.main-title .word {
		font-size: 11rem;
		font-family: 'Google Sans Display', sans-serif;
		font-weight: 900;
		color: #fff;
		text-transform: uppercase;
		display: block;
	}

	.main-title .mini {
		animation: title-color 6s infinite, float-mini 4s ease-in-out infinite;
		transform-origin: center left;
		margin-left: 20px;
	}

	.main-title .games {
		animation: title-color-offset 6s infinite, float-games 5s ease-in-out infinite;
		transform-origin: center right;
		margin-left: 60px;
	}

	.login-card {
		padding: 48px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 32px;
		background: #fff;
		position: relative;
		z-index: 10;
		transform: rotate(-2deg);
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 12px 12px 0px #000;
	}

	.login-card:hover {
		transform: rotate(0deg) scale(1.02);
	}

	.neo-input {
		font-size: 1.4rem;
		padding: 20px;
	}

	.error {
		color: #fff;
		background: var(--md-sys-color-error);
		padding: 16px;
		border: var(--neo-border);
		font-family: var(--font-mono);
		font-size: 1.2rem;
		font-weight: bold;
		text-align: center;
		box-shadow: 4px 4px 0px #000;
	}

	.selector-group h3 {
		margin: 0 0 16px 0;
		font-size: 1.4rem;
		text-align: center;
	}

	.mode-category {
		font-family: var(--font-mono);
		font-weight: bold;
		font-size: 0.9rem;
		margin-bottom: 8px;
		color: #555;
	}

	.neo-toggle {
		display: flex;
		border: var(--neo-border);
		background: #fff;
		box-shadow: 6px 6px 0px #000;
	}

	.toggle-btn {
		flex: 1;
		padding: 20px;
		border: none;
		background: transparent;
		font-family: 'Google Sans Display', sans-serif;
		font-weight: 700;
		font-size: 1.4rem;
		cursor: pointer;
		text-transform: uppercase;
		transition: all 0.2s;
	}

	.toggle-btn:not(:last-child) {
		border-right: var(--neo-border);
	}

	.toggle-btn:hover:not(.active) {
		background: #f0f0f0;
	}

	.toggle-btn.active {
		box-shadow: inset 4px 4px 0px rgba(0,0,0,0.3);
		text-shadow: 2px 2px 0px #000;
	}

	.mini-toggle .toggle-btn {
		padding: 12px;
		font-size: 1rem;
	}
	
	.text-white { color: #fff !important; }
	.text-black { color: #000 !important; text-shadow: none !important; }
	
	.bg-blue { background-color: var(--md-sys-color-primary) !important; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary) !important; }
	.bg-green { background-color: var(--md-sys-color-secondary) !important; }
	.bg-white { background-color: #fff !important; }

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-top: 16px;
	}

	.action-btn {
		font-size: 1.3rem;
		padding: 24px;
	}

	.join-link {
		text-align: center;
		font-family: var(--font-mono);
		font-weight: bold;
		font-size: 1.2rem;
		cursor: pointer;
		margin-top: 16px;
		text-decoration: underline;
		text-decoration-thickness: 4px;
		text-underline-offset: 6px;
		padding: 12px;
		transition: all 0.2s;
	}
	
	.join-link:hover {
		background: #000;
		color: #fff;
		text-decoration: none;
	}

	.join-section {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}
	
	.code-input {
		text-transform: uppercase;
		letter-spacing: 12px;
		font-size: 40px;
		text-align: center;
		font-weight: bold;
		padding: 32px;
	}

	/* Title Animations */
	@keyframes float {
		0% { transform: translateY(0px); }
		50% { transform: translateY(-15px); }
		100% { transform: translateY(0px); }
	}

	@keyframes float-mini {
		0%, 100% { transform: rotate(-3deg) translateY(0); }
		50% { transform: rotate(-1deg) translateY(-12px); }
	}

	@keyframes float-games {
		0%, 100% { transform: rotate(3deg) translateY(0); }
		50% { transform: rotate(1deg) translateY(12px); }
	}

	@keyframes title-color {
		0% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-primary); }
		33% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-error); }
		66% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-tertiary); }
		100% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-primary); }
	}

	@keyframes title-color-offset {
		0% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-tertiary); }
		33% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-secondary); }
		66% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-primary); }
		100% { text-shadow: 8px 8px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, 4px 4px 0px #000, 16px 16px 0px var(--md-sys-color-tertiary); }
	}

	/* Responsive design for smaller screens */
	@media (max-width: 1400px) {
		.main-title .word { font-size: 8rem; }
		.logo { height: 140px; }
		.login-card { padding: 32px; }
	}

	@media (max-width: 1024px) {
		.landing-container {
			flex-direction: column;
			text-align: center;
			padding: 24px;
			gap: 48px;
		}
		.left-column {
			align-items: center;
		}
		.main-title {
			align-items: center;
		}
		.main-title .mini { margin-left: -20px; transform: rotate(-2deg); }
		.main-title .games { margin-left: 20px; transform: rotate(2deg); }
	}

	@media (max-width: 768px) {
		.main-title .word { font-size: 5rem; }
		h2 { font-size: 1.1rem; padding: 12px 16px; }
		.logo { height: 100px; }
		.login-card { transform: none; padding: 24px; }
	}
</style>
