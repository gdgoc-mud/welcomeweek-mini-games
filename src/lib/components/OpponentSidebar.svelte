<script>
	export let opponentName = '';
	export let opponentScore = 0;
	export let opponentProgress = 0;
	export let totalQuestions = 15;
	
	$: progressPercent = (opponentProgress / totalQuestions) * 100;
</script>

<div class="neo-card sidebar">
	<h3>VS {opponentName}</h3>
	
	<div class="score">
		<span class="label">SCORE</span>
		<span class="value">{opponentScore}</span>
	</div>
	
	<div class="progress-section">
		<span class="label">PROGRESS ({opponentProgress}/{totalQuestions})</span>
		<div class="progress-track">
			<div class="progress-fill bg-green" style="width: {progressPercent}%"></div>
		</div>
	</div>
</div>

<style>
	.sidebar {
		padding: 24px;
		width: 250px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		background: #fff;
	}

	h3 {
		margin: 0;
		color: var(--md-sys-color-primary);
		font-size: 24px;
		text-shadow: 2px 2px 0px #000;
		font-family: 'Google Sans Display', sans-serif;
	}

	.score, .progress-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 14px;
		color: #000;
		font-weight: bold;
	}

	.value {
		font-size: 32px;
		font-weight: bold;
		font-family: var(--font-mono);
		background: var(--md-sys-color-tertiary);
		padding: 8px;
		border: var(--neo-border);
		text-align: center;
	}

	.progress-track {
		height: 24px;
		background-color: #fff;
		border: var(--neo-border);
	}

	.progress-fill {
		height: 100%;
		border-right: var(--neo-border);
		transition: width 0.3s ease;
	}
	
	.bg-green { background-color: var(--md-sys-color-secondary); }
</style>

