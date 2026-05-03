<script>
	import '@material/web/all.js';
	import { onMount, onDestroy } from 'svelte';
	import { configStore } from '$lib/stores/config.js';
	import { sessionStore } from '$lib/stores/session.js';
	import { themeStore } from '$lib/stores/theme.js';

	$: theme = $themeStore;

	let canvas;
	let ctx;
	let width, height;
	let animationFrame;
	let nodes = [];
	let cols, rows;
	const spacing = 50;

	let mouseX = -1000, mouseY = -1000;
	
	const colors = {
		'bg-white': { bg: [245, 245, 245], grid: [0, 0, 0, 0.15] },
		'bg-blue': { bg: [26, 115, 232], grid: [255, 255, 255, 0.25] },
		'bg-yellow': { bg: [242, 153, 0], grid: [0, 0, 0, 0.25] },
		'bg-red': { bg: [217, 48, 37], grid: [255, 255, 255, 0.35] },
		'bg-green': { bg: [24, 128, 56], grid: [255, 255, 255, 0.35] }
	};

	let currentBg = [...colors['bg-white'].bg];
	let currentGrid = [...colors['bg-white'].grid];
	let effects = [];
	let prevColor = 'bg-white';

	class Node {
		constructor(x, y) {
			this.baseX = x;
			this.baseY = y;
			this.x = x;
			this.y = y;
			this.vx = 0;
			this.vy = 0;
		}
	}

	function resize() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		
		cols = Math.ceil(width / spacing) + 2;
		rows = Math.ceil(height / spacing) + 2;
		nodes = [];
		for (let i = 0; i < cols; i++) {
			nodes[i] = [];
			for (let j = 0; j < rows; j++) {
				nodes[i][j] = new Node(i * spacing - spacing, j * spacing - spacing);
			}
		}
	}

	function handleMouseMove(e) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function render() {
		const targetColorClass = theme?.colorClass || 'bg-white';
		const target = colors[targetColorClass] || colors['bg-white'];
		
		for(let i = 0; i < 3; i++) {
			currentBg[i] += (target.bg[i] - currentBg[i]) * 0.05;
			currentGrid[i] += (target.grid[i] - currentGrid[i]) * 0.05;
		}
		currentGrid[3] += (target.grid[3] - currentGrid[3]) * 0.05;

		ctx.fillStyle = `rgb(${Math.round(currentBg[0])}, ${Math.round(currentBg[1])}, ${Math.round(currentBg[2])})`;
		ctx.fillRect(0, 0, width, height);

		let time = performance.now() * 0.001;

		if (targetColorClass !== prevColor) {
			if (targetColorClass === 'bg-green') effects.push({ type: 'correct', time: 0 });
			if (targetColorClass === 'bg-red') effects.push({ type: 'wrong', time: 0 });
			prevColor = targetColorClass;
		}

		for (let i = effects.length - 1; i >= 0; i--) {
			effects[i].time += 0.016;
			if (effects[i].time > 1.5) {
				effects.splice(i, 1);
			} else if (effects[i].type === 'wrong') {
				let intensity = (1 - (effects[i].time / 1.5)) * 12;
				for (let c = 0; c < cols; c++) {
					for (let r = 0; r < rows; r++) {
						nodes[c][r].vx += (Math.random() - 0.5) * intensity;
						nodes[c][r].vy += (Math.random() - 0.5) * intensity;
					}
				}
			}
		}

		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				let n = nodes[i][j];
				
				let noiseX = Math.sin(n.baseY * 0.01 + time) * 20 + Math.sin(n.baseX * 0.005 - time) * 15;
				let noiseY = Math.cos(n.baseX * 0.01 + time * 1.2) * 20 + Math.cos(n.baseY * 0.005 + time) * 15;
				
				let targetX = n.baseX + noiseX;
				let targetY = n.baseY + noiseY;

				let dx = mouseX - n.x;
				let dy = mouseY - n.y;
				let dist = Math.sqrt(dx*dx + dy*dy);
				if (dist < 250) {
					let force = (250 - dist) / 250;
					targetX -= (dx / dist) * force * 80;
					targetY -= (dy / dist) * force * 80;
				}

				for (let eff of effects) {
					if (eff.type === 'correct') {
						let radius = eff.time * (Math.max(width, height) * 1.2);
						let thickness = 150;
						let cdx = width/2 - n.baseX;
						let cdy = height/2 - n.baseY;
						let cdist = Math.sqrt(cdx*cdx + cdy*cdy);
						if (Math.abs(cdist - radius) < thickness) {
							let force = (1 - Math.abs(cdist - radius) / thickness) * 40 * (1 - (eff.time / 1.5));
							targetX -= (cdx / cdist) * force;
							targetY -= (cdy / cdist) * force;
						}
					}
				}

				n.vx += (targetX - n.x) * 0.05;
				n.vy += (targetY - n.y) * 0.05;
				n.vx *= 0.75;
				n.vy *= 0.75;
				n.x += n.vx;
				n.y += n.vy;
			}
		}

		ctx.strokeStyle = `rgba(${Math.round(currentGrid[0])}, ${Math.round(currentGrid[1])}, ${Math.round(currentGrid[2])}, ${currentGrid[3]})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		
		for (let j = 0; j < rows; j++) {
			for (let i = 0; i < cols; i++) {
				let n = nodes[i][j];
				if (i === 0) ctx.moveTo(n.x, n.y);
				else ctx.lineTo(n.x, n.y);
			}
		}
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				let n = nodes[i][j];
				if (j === 0) ctx.moveTo(n.x, n.y);
				else ctx.lineTo(n.x, n.y);
			}
		}
		ctx.stroke();

		animationFrame = requestAnimationFrame(render);
	}

	onMount(async () => {
		const res = await fetch('/api/config');
		if (res.ok) {
			const data = await res.json();
			configStore.set({ hostIp: data.hostIp });
		}
		
		sessionStore.init();

		ctx = canvas.getContext('2d');
		window.addEventListener('resize', resize);
		window.addEventListener('mousemove', handleMouseMove);
		resize();
		render();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(animationFrame);
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Display:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</svelte:head>

<canvas bind:this={canvas} class="warp-canvas"></canvas>

<div class="app-container">
	<slot />
</div>

<style>
	:global(:root) {
		/* Neobrutalism Tokens */
		--neo-border: 4px solid #000;
		--neo-shadow: 8px 8px 0px #000;
		--neo-shadow-hover: 4px 4px 0px #000;
		--neo-shadow-active: 0px 0px 0px #000;
		--neo-radius: 0px; /* Sharp corners */
		
		--md-sys-color-primary: #1a73e8; /* Google Blue */
		--md-sys-color-secondary: #188038; /* Google Green */
		--md-sys-color-tertiary: #f29900; /* Google Yellow */
		--md-sys-color-error: #d93025; /* Google Red */
		--md-sys-color-surface: #FFFFFF;
		--md-sys-color-surface-variant: #F1F3F4;
		--md-sys-color-on-surface: #000000;
		--md-sys-color-on-primary: #FFFFFF;
		--md-sys-color-outline: #000000;
		--md-sys-color-background: #ffffff;

		/* Font families */
		--md-sys-typescale-body-large-font: 'Google Sans', sans-serif;
		--md-sys-typescale-body-medium-font: 'Google Sans', sans-serif;
		--md-sys-typescale-body-small-font: 'Google Sans', sans-serif;
		--md-sys-typescale-label-large-font: 'Google Sans', sans-serif;
		--md-sys-typescale-title-large-font: 'Google Sans', sans-serif;
		--md-sys-typescale-headline-large-font: 'Google Sans Display', sans-serif;
		--md-sys-typescale-display-large-font: 'Google Sans Display', sans-serif;
		
		--font-mono: 'JetBrains Mono', monospace;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: var(--md-sys-color-background);
		color: var(--md-sys-color-on-surface);
		font-family: 'Google Sans', sans-serif;
		overflow-x: hidden;
	}
	
	:global(*) {
		box-sizing: border-box;
	}

	.warp-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -2;
		pointer-events: none;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100vw;
		position: relative;
		z-index: 10;
		background: transparent;
	}

	/* Dynamic Colors (Utility classes for UI components) */
	:global(.bg-white) { background-color: #f0f0f0 !important; }
	:global(.bg-blue) { background-color: var(--md-sys-color-primary) !important; }
	:global(.bg-yellow) { background-color: var(--md-sys-color-tertiary) !important; }
	:global(.bg-red) { background-color: var(--md-sys-color-error) !important; }
	:global(.bg-green) { background-color: var(--md-sys-color-secondary) !important; }

	/* Reset default link styling globally */
	:global(a) {
		color: inherit;
		text-decoration: none;
	}
	
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Google Sans Display', sans-serif;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 2px;
	}
	
	/* Brutalist Button Styles */
	:global(.neo-btn) {
		border: var(--neo-border);
		box-shadow: var(--neo-shadow);
		background: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);
		font-family: 'Google Sans Display', sans-serif;
		font-weight: 900;
		font-size: 1.1rem;
		text-transform: uppercase;
		padding: 16px 32px;
		cursor: pointer;
		transition: transform 0.1s, box-shadow 0.1s;
		border-radius: 0;
	}
	
	:global(.neo-btn:hover:not(:disabled)) {
		transform: translate(4px, 4px);
		box-shadow: var(--neo-shadow-hover);
	}
	
	:global(.neo-btn:active:not(:disabled)) {
		transform: translate(8px, 8px);
		box-shadow: var(--neo-shadow-active);
	}

	:global(.neo-btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	/* Brutalist Card Styles */
	:global(.neo-card) {
		border: var(--neo-border);
		box-shadow: var(--neo-shadow);
		background: var(--md-sys-color-surface);
		border-radius: 0;
	}
	
	:global(.neo-input) {
		border: var(--neo-border);
		background: var(--md-sys-color-surface);
		padding: 16px;
		font-family: var(--font-mono);
		font-size: 1.1rem;
		border-radius: 0;
		font-weight: bold;
	}
	:global(.neo-input:focus) {
		outline: none;
		box-shadow: var(--neo-shadow);
	}
</style>
