<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { setTheme } from '$lib/stores/theme.js';
	
	$: session = $sessionStore;
	let eventSource;
	let position = 0; // -100 to 100
	let timeLeft = 60;
	let timer;
	
	const wordList = [
		'sudo', 'git push', 'npm start', 'docker build', 'rm -rf', 
		'systemctl', 'chmod +x', 'curl', 'wget', 'grep', 'awk', 
		'sed', 'tar -xzf', 'ssh', 'ping', 'netstat', 'ifconfig',
		'cd ..', 'ls -la', 'mkdir', 'touch', 'vi', 'nano', 'vim',
		'docker-compose up', 'kubectl get pods', 'nmap', 'traceroute',
		'htop', 'top', 'ps aux', 'kill -9', 'chown', 'chgrp', 'df -h',
		'tail -f', 'head', 'cat', 'less', 'more', 'find . -name',
		'scp', 'rsync', 'iptables', 'tcpdump', 'ufw', 'systemd',
		'journalctl', 'make install', 'gcc', 'g++', 'python3', 'node',
		'npm install', 'yarn build', 'pnpm dev', 'cargo run', 'go build',
		'rustc', 'php', 'ruby', 'java', 'javac', 'mvn clean', 'gradlew',
		'git pull', 'git commit', 'git status', 'git checkout', 'git rebase',
		'git merge', 'git stash', 'git log', 'git reset --hard',
		'SELECT * FROM', 'DROP TABLE', 'INSERT INTO', 'UPDATE', 'DELETE'
	];
	let currentWord = '';
	let userInput = '';
	let errorFlash = false;
	let hostName = 'HOST';
	let guestName = 'GUEST';
	let showTutorial = true;
	let iAmReady = false;
	let gameStarted = false;
	
	function nextWord() {
		currentWord = wordList[Math.floor(Math.random() * wordList.length)];
		userInput = '';
	}

	onMount(() => {
		setTheme('lines-h', 'bg-white');
		if (!session.roomCode) { goto('/'); return; }
		
		nextWord();
		
		eventSource = new EventSource(`/api/room/${session.roomCode}/events`);
		eventSource.addEventListener('sync', (e) => {
			const state = JSON.parse(e.data);
			if (state.host) hostName = state.host.name;
			if (state.guest) guestName = state.guest.name;
			
			if (state.gameState) {
				if (state.gameState.position !== undefined) {
					position = state.gameState.position;
					
					let hScore = position > 0 ? 1 : 0;
					let gScore = position < 0 ? 1 : 0;
					sessionStore.updateSession({
						score: session.isHost ? hScore : gScore,
						opponentScore: session.isHost ? gScore : hScore
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

	$: if (Math.abs(position) >= 100 && timeLeft > 0) {
		timeLeft = 0;
		clearInterval(timer);
		finishGame();
	}

	async function finishGame() {
		let hScore = position > 0 ? 1 : 0;
		let gScore = position < 0 ? 1 : 0;
		const finalScore = session.isHost ? hScore : gScore;
		const oppScore = session.isHost ? gScore : hScore;
		
		sessionStore.updateSession({ score: finalScore, opponentScore: oppScore });
		
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

	async function handleInput(e) {
		if (e.data && e.inputType !== 'deleteContentBackward') {
			if (!currentWord.startsWith(userInput)) {
				// Typo penalty
				errorFlash = true;
				setTimeout(() => errorFlash = false, 200);
			}
		}

		if (userInput === currentWord) {
			const amount = session.isHost ? 5 : -5;
			nextWord();
			await fetch(`/api/room/${session.roomCode}/action`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isHost: session.isHost, action: 'type', payload: { amount } })
			});
		}
	}
</script>

<div class="screen-flash wrong-flash" class:active={errorFlash}></div>

{#if showTutorial}
<div class="tutorial-overlay">
	<div class="tutorial-card neo-card bg-yellow">
		<h2>HOW TO PLAY</h2>
		<p>Type the commands perfectly to push the progress bar into the enemy's side!</p>
		<div class="direction">
			{#if session.isHost}
				<span class="text-blue">👉 YOUR TARGET: PUSH RIGHT</span>
			{:else}
				<span class="text-red">👈 YOUR TARGET: PUSH LEFT</span>
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

<div class="ddos-container">
	<div class="header">
		<div class="title bg-white neo-card">DDOS DEFENDER</div>
		<div class="timer bg-yellow neo-card">{timeLeft}s</div>
	</div>

	<div class="tug-of-war-wrapper neo-card">
		<div class="labels">
			<span class="host-label text-blue">
				{hostName.toUpperCase()}'S NETWORK {#if session.isHost}<span class="you-badge bg-blue text-white">(YOU)</span>{/if}
			</span>
			<span class="guest-label text-red">
				{#if !session.isHost}<span class="you-badge bg-red text-white">(YOU)</span>{/if} {guestName.toUpperCase()}'S NETWORK
			</span>
		</div>
		<div class="tug-track">
			<div class="tug-host" style="width: {50 + position / 2}%;"></div>
			<div class="tug-guest" style="width: {50 - position / 2}%;"></div>
			<div class="center-line"></div>
		</div>
	</div>

	<div class="typing-area neo-card bg-white" class:shake={errorFlash}>
		<h3>TYPE TO PUSH THE LOAD:</h3>
		<div class="target-word">{currentWord}</div>
		<input 
			type="text" 
			class="neo-input type-input" 
			bind:value={userInput} 
			on:input={handleInput}
			placeholder="Start typing..."
			autocomplete="off"
			spellcheck="false"
			autofocus
		/>
	</div>
</div>

<style>
	.ddos-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		height: 100vh;
		gap: 64px;
	}

	.header {
		display: flex;
		gap: 32px;
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: bold;
	}

	.title, .timer {
		padding: 16px 32px;
	}

	.tug-of-war-wrapper {
		width: 100%;
		max-width: 1000px;
		padding: 32px;
		background: #222;
		position: relative;
	}

	.labels {
		display: flex;
		justify-content: space-between;
		font-family: 'Google Sans Display';
		font-weight: 900;
		font-size: 1.5rem;
		margin-bottom: 16px;
	}
	
	.text-blue { color: #64b5f6; }
	.text-red { color: #e57373; }

	.tug-track {
		height: 64px;
		background: #000;
		border: 4px solid #fff;
		position: relative;
		display: flex;
		overflow: hidden;
	}

	.tug-host {
		height: 100%;
		background-color: var(--md-sys-color-primary);
		transition: width 0.2s cubic-bezier(0.25, 1, 0.5, 1);
	}

	.tug-guest {
		height: 100%;
		background-color: var(--md-sys-color-error);
		transition: width 0.2s cubic-bezier(0.25, 1, 0.5, 1);
	}

	.center-line {
		position: absolute;
		top: -10%;
		left: 50%;
		height: 120%;
		width: 6px;
		background: #fff;
		transform: translateX(-50%);
		z-index: 2;
	}

	.typing-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px;
		width: 100%;
		max-width: 800px;
	}

	h3 {
		margin: 0 0 16px 0;
		font-family: var(--font-mono);
		font-size: 1.5rem;
		color: #555;
	}

	.target-word {
		font-family: var(--font-mono);
		font-size: 4rem;
		font-weight: bold;
		letter-spacing: 4px;
		margin-bottom: 32px;
		text-align: center;
		background: var(--md-sys-color-tertiary);
		padding: 16px 32px;
		border: var(--neo-border);
		box-shadow: 8px 8px 0px #000;
	}

	.type-input {
		width: 100%;
		font-size: 2.5rem;
		text-align: center;
		padding: 24px;
		border: 4px solid #000;
		box-shadow: inset 4px 4px 0px rgba(0,0,0,0.1);
	}
	
	.type-input:focus {
		background: #f8f9fa;
	}

	.screen-flash {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		opacity: 0;
		z-index: 5;
		transition: opacity 0.1s;
	}

	.screen-flash.wrong-flash.active {
		background-color: rgba(217, 48, 37, 0.4);
		opacity: 1;
	}

	.shake {
		animation: shake 0.3s;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-15px); }
		40%, 80% { transform: translateX(15px); }
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
	
	.you-badge { 
		padding: 4px 8px; 
		font-size: 1rem; 
		border-radius: 4px; 
		vertical-align: middle; 
		margin: 0 8px; 
		font-family: var(--font-mono); 
	}

	@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
	
	.bg-white { background-color: #fff; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary); }
	.bg-blue { background-color: var(--md-sys-color-primary); }
	.bg-red { background-color: var(--md-sys-color-error); }
	.text-white { color: #fff !important; }
</style>