<script>
	export let time = 45;
	export let maxTime = 45;
	
	$: progress = time / maxTime;
	$: isLow = time <= 10;
</script>

<div class="neo-timer" class:pulsing={isLow} class:low={isLow}>
	<div class="time-text">{time}s</div>
</div>

<style>
	.neo-timer {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
		border: var(--neo-border);
		box-shadow: var(--neo-shadow);
		transition: background-color 0.3s, color 0.3s;
	}

	.neo-timer.low {
		background: var(--md-sys-color-error);
		color: #fff;
	}

	.time-text {
		font-family: var(--font-mono);
		font-size: 24px;
		font-weight: bold;
	}

	.pulsing {
		animation: pop 1s infinite;
	}

	@keyframes pop {
		0% { transform: scale(1); }
		50% { transform: scale(1.1); box-shadow: 8px 8px 0px #000; }
		100% { transform: scale(1); }
	}
</style>
