<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { themeStore, setTheme } from '$lib/stores/theme.js';
	import { triviaBank } from '$lib/data/trivia.js';
	import { playTone } from '$lib/audio.js';
	import CountdownRing from '$lib/components/CountdownRing.svelte';
	import ScorePopup from '$lib/components/ScorePopup.svelte';
	import OpponentSidebar from '$lib/components/OpponentSidebar.svelte';

	$: session = $sessionStore;
	
	let currentIndex = 0;
	let time = 90;
	let timer;
	let hintUsed = false;
	let currentScore = 0;
	let history = []; // Track points per question
	let opponentHistory = [];
	
	let scorePopups = [];
	let isCorrectFlash = false;
	let isWrongFlash = false;
	let selectedOption = null;

	let eventSource;
	let isWaiting = false;

	$: question = triviaBank[currentIndex];
	let currentOptions = [];
	let actualCorrectIndex = 0;

	$: {
		if (question) {
			let mapped = question.options.map((opt, i) => ({ text: opt, isCorrect: i === question.correctIndex }));
			// Fisher-Yates shuffle
			for (let i = mapped.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[mapped[i], mapped[j]] = [mapped[j], mapped[i]];
			}
			currentOptions = mapped;
			actualCorrectIndex = mapped.findIndex(m => m.isCorrect);
		}
	}

	onMount(() => {
		setTheme('waves', 'bg-white'); // Initial play theme

		if (!session.name) {
			goto('/');
			return;
		}

		currentScore = session.score || 0;
		startTimer();

		if (session.roomCode) {
			eventSource = new EventSource(`/api/room/${session.roomCode}/events`);
			eventSource.addEventListener('sync', (e) => {
				const state = JSON.parse(e.data);
				const opp = session.isHost ? state.guest : state.host;
				if (opp) {
					opponentHistory = opp.history || [];
					sessionStore.updateSession({
						opponentScore: opp.score,
						opponentProgress: opp.progress,
						opponentHistory
					});
				}
			});
			eventSource.addEventListener('game_over', () => {
				goto('/gg');
			});
		}
	});

	onDestroy(() => {
		clearInterval(timer);
		if (eventSource) eventSource.close();
	});

	function startTimer() {
		time = 90;
		hintUsed = false;
		selectedOption = null;
		setTheme('waves', 'bg-white');
		
		clearInterval(timer);
		timer = setInterval(() => {
			time--;
			if (time <= 0) {
				clearInterval(timer);
				handleAnswer(-1, true); // Auto-skip timeout
			}
		}, 1000);
	}

	async function pushSync(scoreDelta, isFinished = false, questionResult = null) {
		currentScore += scoreDelta;
		
		if (questionResult) {
			history = [...history, questionResult];
		}
		
		sessionStore.updateSession({ score: currentScore, history });
		
		if (session.roomCode) {
			await fetch(`/api/room/${session.roomCode}/update`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					isHost: session.isHost,
					score: currentScore,
					progress: currentIndex + 1,
					finished: isFinished,
					history
				})
			});
		}
	}

	async function handleAnswer(index, isTimeout = false) {
		if (selectedOption !== null) return;
		selectedOption = index;
		clearInterval(timer);

		let points = 0;
		let correct = false;

		if (index === actualCorrectIndex && !isTimeout) {
			correct = true;
			playTone('correct');
			isCorrectFlash = true;
			setTheme('solid', 'bg-green');
			
			// Kahoot style scoring: max 1000, drops as time goes down.
			// Base points based on remaining time out of 90s. Minimum 500 for right answer.
			const maxPts = 1000;
			const minPts = 500;
			points = Math.floor(minPts + ((time / 90) * (maxPts - minPts)));
			if (hintUsed) points = Math.floor(points * 0.5);

			if (points > 0) {
				scorePopups = [...scorePopups, { id: Date.now(), x: window.innerWidth / 2, y: window.innerHeight / 2, points }];
			}
		} else {
			playTone('wrong');
			isWrongFlash = true;
			setTheme('lines', 'bg-red');
		}

		await pushSync(points, currentIndex === triviaBank.length - 1, { correct, points });

		setTimeout(() => {
			isCorrectFlash = false;
			isWrongFlash = false;
			nextQuestion();
		}, 1500);
	}

	function nextQuestion() {
		if (currentIndex < triviaBank.length - 1) {
			currentIndex++;
			startTimer();
		} else {
			isWaiting = true;
			setTheme('grid', 'bg-blue');
			if (!session.roomCode) {
				goto('/gg');
			}
		}
	}
</script>

<div class="screen-flash correct-flash" class:active={isCorrectFlash}></div>
<div class="screen-flash wrong-flash" class:active={isWrongFlash}></div>

<div class="play-container full-width">
	{#if isWaiting}
		<div class="waiting-card">
			<h1>FINISHED FIRST!</h1>
			<p>WAITING FOR OPPONENT TO FINISH...</p>
		</div>
	{:else}
		<div class="game-area neo-card">
			<div class="header neo-card bg-white">
				<div class="score-display">SCORE: {currentScore}</div>
				<div class="progress">Q{currentIndex + 1}/{triviaBank.length}</div>
				<CountdownRing {time} maxTime={90} />
			</div>

			<div class="question-card neo-card bg-white" class:shake={isWrongFlash}>
				<h2>{question.question}</h2>
			</div>

			<div class="options-grid">
				{#each currentOptions as opt, i}
					<button 
						class="neo-btn option-btn {selectedOption === i ? (i === actualCorrectIndex ? 'bg-green text-white' : 'bg-red text-white') : 'bg-white'}"
						disabled={selectedOption !== null}
						on:click={() => handleAnswer(i)}
					>
						{opt.text}
					</button>
				{/each}
			</div>

			<div class="footer">
				{#if !hintUsed}
					<div class="hint-wrapper">
						<button 
							class="neo-btn bg-yellow hint-btn" 
							on:click={() => hintUsed = true}
							disabled={selectedOption !== null}
						>
							USE HINT (-50% PTS)
						</button>
					</div>
				{:else}
					<div class="hint-text"><strong>HINT:</strong> {question.hint}</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if session.roomCode && !isWaiting}
		<OpponentSidebar 
			opponentName={session.opponentName} 
			opponentScore={session.opponentScore} 
			opponentProgress={session.opponentProgress} 
			totalQuestions={triviaBank.length}
		/>
	{/if}
</div>

{#each scorePopups as p (p.id)}
	<ScorePopup x={p.x} y={p.y} points={p.points} />
{/each}

<style>
	.play-container.full-width {
		display: flex;
		gap: 24px;
		padding: 24px;
		min-height: 100vh;
		width: 100vw;
		max-width: none;
	}

	.game-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 32px;
		position: relative;
		z-index: 10;
		background: rgba(255, 255, 255, 0.9);
	}

	.waiting-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px;
		color: #fff;
		text-align: center;
	}
	
	.waiting-card h1 {
		font-size: 5rem;
		text-shadow: 6px 6px 0px #000;
	}

	.waiting-card p {
		font-size: 2rem;
		font-weight: bold;
		text-shadow: 2px 2px 0px #000;
		font-family: var(--font-mono);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		padding: 16px 24px;
	}

	.score-display {
		font-family: var(--font-mono);
		font-size: 32px;
		font-weight: bold;
		background: var(--md-sys-color-tertiary);
		padding: 8px 16px;
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
	}

	.progress {
		font-size: 24px;
		font-weight: bold;
		font-family: 'Google Sans Display', sans-serif;
	}

	.question-card {
		margin-bottom: 48px;
		text-align: center;
		min-height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
	}

	h2 {
		font-size: 2.5rem;
		margin: 0;
		color: #000;
		line-height: 1.4;
	}

	.options-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-bottom: auto;
	}

	.option-btn {
		padding: 32px;
		font-size: 1.5rem;
		cursor: pointer;
		text-transform: none; /* Keep original casing for questions if any */
		font-weight: bold;
		text-align: left;
	}

	.bg-white { background-color: #fff !important; }
	.bg-green { background-color: var(--md-sys-color-secondary) !important; }
	.bg-red { background-color: var(--md-sys-color-error) !important; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary) !important; }
	.text-white { color: #fff !important; text-shadow: 2px 2px 0px #000; }

	.footer {
		margin-top: 32px;
		min-height: 60px;
		display: flex;
		justify-content: center;
	}

	.hint-wrapper {
		position: relative;
	}

	.hint-text {
		padding: 16px;
		background-color: var(--md-sys-color-tertiary);
		color: #000;
		font-size: 1.2rem;
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
		width: 100%;
		text-align: center;
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
		transition: opacity 0.3s;
	}

	.screen-flash.correct-flash.active {
		background-color: rgba(24, 128, 56, 0.4);
		opacity: 1;
	}

	.screen-flash.wrong-flash.active {
		background-color: rgba(217, 48, 37, 0.4);
		opacity: 1;
	}

	.shake {
		animation: shake 0.5s;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-15px); }
		40%, 80% { transform: translateX(15px); }
	}
</style>
