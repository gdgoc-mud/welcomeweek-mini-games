<script>
	export let points = 0;
	export let x = 0;
	export let y = 0;
	
	import { onMount } from 'svelte';
	let visible = true;
	
	onMount(() => {
		setTimeout(() => {
			visible = false;
		}, 1000);
	});
</script>

{#if visible}
	<div 
		class="score-popup" 
		style="left: {x}px; top: {y}px;"
	>
		+{points}
	</div>
{/if}

<style>
	.score-popup {
		position: absolute;
		color: var(--md-sys-color-tertiary);
		font-family: 'Google Sans Display', sans-serif;
		font-size: 32px;
		font-weight: bold;
		pointer-events: none;
		z-index: 100;
		animation: floatUp 1s ease-out forwards;
		text-shadow: 0 2px 4px rgba(0,0,0,0.5);
	}

	@keyframes floatUp {
		0% { transform: translateY(0) scale(0.5); opacity: 0; }
		20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
		80% { transform: translateY(-60px) scale(1); opacity: 1; }
		100% { transform: translateY(-80px) scale(1); opacity: 0; }
	}
</style>
