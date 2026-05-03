<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import { themeStore, setTheme } from '$lib/stores/theme.js';
	import { debugBank } from '$lib/data/debug.js';
	import { playTone } from '$lib/audio.js';
	import CountdownRing from '$lib/components/CountdownRing.svelte';
	import EditableCodeBlock from '$lib/components/EditableCodeBlock.svelte';
	import OpponentSidebar from '$lib/components/OpponentSidebar.svelte';
	import ScorePopup from '$lib/components/ScorePopup.svelte';

	$: session = $sessionStore;
	
	let currentIndex = 0;
	let time = 120;
	let timer;
	let hintUsed = false;
	let currentScore = 0;
	let history = [];
	let opponentHistory = [];
	
	let userCode = '';
	let submitted = false;
	let isWaiting = false;
	let isWrongFlash = false;
	let isCorrectFlash = false;
	let scorePopups = [];

	let eventSource;

	$: snippet = debugBank[currentIndex];

	function initQuestionCode() {
		userCode = snippet.code;
	}

	$: if (snippet) {
		initQuestionCode();
	}

	onMount(() => {
		setTheme('grid', 'bg-white');

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
		time = 120;
		hintUsed = false;
		submitted = false;
		initQuestionCode();
		setTheme('grid', 'bg-white');
		
		clearInterval(timer);
		timer = setInterval(() => {
			time--;
			if (time <= 0) {
				clearInterval(timer);
				submitAnswer(true); // Auto-skip
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

	async function submitAnswer(isTimeout = false) {
		if (submitted) return;
		submitted = true;
		clearInterval(timer);

		let fixCorrect = false;

		if (!isTimeout) {
			if (snippet.validate) {
				try {
					fixCorrect = snippet.validate(userCode);
				} catch (e) {
					console.error("Validation error:", e);
					fixCorrect = false;
				}
			}
		}

		let points = 0;

		if (fixCorrect) {
			playTone('correct');
			isCorrectFlash = true;
			setTheme('solid', 'bg-green');
			
			// Scoring max 2000, minimum 1000. Drops linearly.
			const maxPts = 2000;
			const minPts = 1000;
			points = Math.floor(minPts + ((time / 120) * (maxPts - minPts)));
			if (hintUsed) points = Math.floor(points * 0.5);

			if (points > 0) {
				scorePopups = [...scorePopups, { id: Date.now(), x: window.innerWidth / 2, y: window.innerHeight / 2, points }];
			}
		} else {
			playTone('wrong');
			isWrongFlash = true;
			setTheme('lines', 'bg-red');
		}

		await pushSync(points, currentIndex === debugBank.length - 1, { correct: fixCorrect, points });

		setTimeout(() => {
			isCorrectFlash = false;
			isWrongFlash = false;
			nextQuestion();
		}, 1500);
	}

	function nextQuestion() {
		if (currentIndex < debugBank.length - 1) {
			currentIndex++;
			startTimer();
		} else {
			isWaiting = true;
			setTheme('solid', 'bg-blue');
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
			<p>WAITING FOR OPPONENT...</p>
		</div>
	{:else}
		<div class="game-area">
			<div class="header neo-card bg-white">
				<div class="score-display">SCORE: {currentScore}</div>
				<div class="progress">CHALLENGE {currentIndex + 1} OF {debugBank.length}</div>
				<CountdownRing {time} maxTime={120} />
			</div>

			<div class="content-split" class:shake={isWrongFlash}>
				<div class="code-panel neo-card bg-white">
					<h3>{snippet.title}</h3>
					<p class="question-text">{snippet.question}</p>
					<div class="hint-wrapper" class:hint-active={hintUsed}>
						<EditableCodeBlock bind:code={userCode} disabled={submitted} />
					</div>
				</div>

				<div class="fix-panel neo-card bg-white">
					<div class="actions">
						{#if !hintUsed}
							<div class="hint-wrapper-btn">
								<button 
									class="neo-btn bg-yellow hint-btn"
									on:click={() => hintUsed = true} 
									disabled={submitted}
								>
									GET HINT (-50% PTS)
								</button>
							</div>
						{:else}
							<div class="hint-text"><strong>HINT:</strong> {snippet.hint}</div>
						{/if}

						<button 
							class="neo-btn bg-primary text-white submit-btn"
							on:click={() => submitAnswer()} 
							disabled={submitted}
						>
							SUBMIT FIX
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if session.roomCode && !isWaiting}
		<OpponentSidebar 
			opponentName={session.opponentName} 
			opponentScore={session.opponentScore} 
			opponentProgress={session.opponentProgress} 
			totalQuestions={debugBank.length}
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
		gap: 24px;
		position: relative;
		z-index: 10;
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
		padding: 24px;
	}

	.score-display {
		font-family: var(--font-mono);
		font-size: 32px;
		font-weight: bold;
		background: var(--md-sys-color-secondary);
		color: #fff;
		padding: 8px 16px;
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
	}

	.progress {
		font-size: 24px;
		font-weight: bold;
		font-family: 'Google Sans Display', sans-serif;
	}

	.content-split {
		display: flex;
		gap: 24px;
		flex: 1;
	}

	.code-panel {
		flex: 3;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 32px;
	}

	.fix-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 32px;
		justify-content: flex-end;
	}

	h3 {
		margin: 0;
		color: #000;
		font-size: 24px;
		border-bottom: var(--neo-border);
		padding-bottom: 12px;
	}

	.hint-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.hint-wrapper.hint-active :global(.code-editor) {
		box-shadow: 8px 8px 0px var(--md-sys-color-tertiary);
	}

	.question-text {
		font-size: 1.2rem;
		line-height: 1.5;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: auto;
	}

	.hint-wrapper-btn {
		width: 100%;
	}
	
	.hint-wrapper-btn .hint-btn {
		width: 100%;
		padding: 24px;
		font-size: 1.2rem;
	}

	.submit-btn {
		padding: 24px;
		font-size: 1.5rem;
	}

	.hint-text {
		color: #000;
		font-size: 16px;
		padding: 16px;
		background-color: var(--md-sys-color-tertiary);
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
	}

	.bg-white { background-color: rgba(255,255,255,0.95) !important; }
	.bg-green { background-color: var(--md-sys-color-secondary) !important; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary) !important; }
	.bg-primary { background-color: var(--md-sys-color-primary) !important; }
	.bg-red { background-color: var(--md-sys-color-error) !important; }
	.text-white { color: #fff !important; }

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
		20%, 60% { transform: translateX(-10px); }
		40%, 80% { transform: translateX(10px); }
	}
</style>
