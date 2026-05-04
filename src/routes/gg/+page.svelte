<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.js';
	import Confetti from '$lib/components/Confetti.svelte';

	$: session = $sessionStore;
	let animatedScore = 0;
	let submitted = false;

	$: history = session.history || [];
	$: opponentHistory = session.opponentHistory || [];

	onMount(async () => {
		if (!session.name) {
			goto('/');
			return;
		}

		// Animate score count up
		const duration = 2000;
		const steps = 60;
		const increment = session.score / steps;
		let currentStep = 0;

		const timer = setInterval(() => {
			currentStep++;
			animatedScore = Math.min(Math.floor(increment * currentStep), session.score);
			if (currentStep >= steps) clearInterval(timer);
		}, duration / steps);

		// Submit score
		if (!submitted) {
			try {
				await fetch('/api/leaderboard', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: session.name,
						mode: session.mode,
						score: session.score,
						playerCount: session.playerCount,
						opponent: session.opponentName || null
					})
				});
				submitted = true;
			} catch (e) {
				console.error('Failed to submit score');
			}
		}
	});

	function goHome() {
		sessionStore.resetSession();
		goto('/');
	}

	$: isWinner = session.playerCount === 2 && session.score > session.opponentScore;
	$: isTie = session.playerCount === 2 && session.score === session.opponentScore;
</script>

{#if session.playerCount === 1 || isWinner}
	<Confetti />
{/if}

<div class="gg-container">
	<div class="neo-card gg-card">
		<h1 class="gg-title">GG!</h1>
		
		{#if session.playerCount === 2}
			<div class="result-badge {isWinner ? 'bg-green' : isTie ? 'bg-yellow' : 'bg-red'} text-white">
				{isWinner ? 'VICTORY' : isTie ? 'TIE' : 'DEFEAT'}
			</div>
		{/if}

		{#if session.mode !== 'ddos'}
			<div class="score-display">
				<div class="label">FINAL SCORE</div>
				<div class="number">{animatedScore}</div>
			</div>
		{/if}

		{#if history.length > 0}
			<div class="recap-section">
				<div class="label">YOUR MATCH RECAP</div>
				<div class="history-grid">
					{#each history as result, i}
						<div class="history-block {result.correct ? 'correct' : 'wrong'}">
							<span class="block-number">{i + 1}</span>
							{#if result.correct}
								<span class="block-icon">✓</span>
								<span class="block-pts">+{result.points}</span>
							{:else}
								<span class="block-icon">✗</span>
								<span class="block-pts">+0</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if session.playerCount === 2}
			<div class="opponent-stats neo-card">
				<div class="vs-text">VS {session.opponentName}</div>
				{#if session.mode !== 'ddos'}
					<div class="opp-score">{session.opponentScore}</div>
				{/if}
				{#if opponentHistory.length > 0}
					<div class="history-grid mini">
						{#each opponentHistory as result}
							<div class="history-block mini {result.correct ? 'correct' : 'wrong'}"></div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div class="actions">
			<button class="neo-btn bg-blue text-white" on:click={() => goto('/leaderboard')}>VIEW LEADERBOARD</button>
			<button class="neo-btn bg-white" on:click={goHome}>PLAY AGAIN</button>
		</div>
	</div>
</div>

<style>
	.gg-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 24px;
	}

	.gg-card {
		padding: 48px;
		text-align: center;
		min-width: 400px;
		max-width: 800px;
		background: #fff;
		position: relative;
		z-index: 10;
		animation: dropIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.gg-title {
		font-size: 80px;
		margin: 0 0 24px 0;
		color: #000;
		text-shadow: 4px 4px 0px var(--md-sys-color-tertiary);
		font-family: 'Google Sans Display', sans-serif;
	}

	.result-badge {
		display: inline-block;
		padding: 12px 32px;
		font-weight: bold;
		font-size: 24px;
		margin-bottom: 32px;
		letter-spacing: 2px;
		border: var(--neo-border);
		box-shadow: 4px 4px 0px #000;
	}

	.bg-green { background-color: var(--md-sys-color-secondary) !important; }
	.bg-red { background-color: var(--md-sys-color-error) !important; }
	.bg-yellow { background-color: var(--md-sys-color-tertiary) !important; color: #000 !important; }
	.bg-blue { background-color: var(--md-sys-color-primary) !important; }
	.bg-white { background-color: #fff !important; }
	.text-white { color: #fff !important; }

	.score-display {
		margin-bottom: 40px;
	}

	.label {
		color: #000;
		font-size: 16px;
		letter-spacing: 4px;
		margin-bottom: 12px;
		font-weight: bold;
	}

	.number {
		font-family: var(--font-mono);
		font-size: 96px;
		font-weight: bold;
		color: #000;
		text-shadow: 4px 4px 0px var(--md-sys-color-secondary);
		line-height: 1;
	}

	.recap-section {
		margin-bottom: 40px;
		padding: 24px;
		background: #f8f9fa;
		border: var(--neo-border);
	}

	.history-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
	}

	.history-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		border: 3px solid #000;
		font-weight: bold;
		font-family: var(--font-mono);
	}

	.history-block.correct {
		background-color: var(--md-sys-color-secondary);
		color: #fff;
	}

	.history-block.wrong {
		background-color: var(--md-sys-color-error);
		color: #fff;
	}

	.block-number {
		font-size: 12px;
		opacity: 0.8;
	}

	.block-icon {
		font-size: 20px;
		line-height: 1;
	}

	.block-pts {
		font-size: 10px;
		margin-top: 2px;
	}

	.opponent-stats {
		background-color: #f0f0f0;
		padding: 24px;
		margin-bottom: 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.vs-text {
		font-size: 16px;
		color: #000;
		margin-bottom: 8px;
		font-weight: bold;
	}

	.opp-score {
		font-family: var(--font-mono);
		font-size: 32px;
		font-weight: bold;
		color: var(--md-sys-color-primary);
		margin-bottom: 16px;
	}

	.history-grid.mini {
		gap: 4px;
	}

	.history-block.mini {
		width: 24px;
		height: 24px;
		border-width: 2px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	@keyframes dropIn {
		0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
		100% { transform: translateY(0) scale(1); opacity: 1; }
	}
</style>
