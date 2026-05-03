<script>
	import { onMount } from 'svelte';
	
	let canvas;
	
	onMount(() => {
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		const particles = [];
		const colors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335'];
		
		for (let i = 0; i < 150; i++) {
			particles.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height - canvas.height,
				w: Math.random() * 10 + 5,
				h: Math.random() * 10 + 5,
				color: colors[Math.floor(Math.random() * colors.length)],
				vy: Math.random() * 5 + 2,
				vx: Math.random() * 4 - 2,
				rot: Math.random() * 360,
				rotSpeed: Math.random() * 10 - 5
			});
		}
		
		let animationId;
		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			particles.forEach(p => {
				p.y += p.vy;
				p.x += p.vx;
				p.rot += p.rotSpeed;
				
				if (p.y > canvas.height) {
					p.y = -20;
					p.x = Math.random() * canvas.width;
				}
				
				ctx.save();
				ctx.translate(p.x + p.w/2, p.y + p.h/2);
				ctx.rotate(p.rot * Math.PI / 180);
				ctx.fillStyle = p.color;
				ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
				ctx.restore();
			});
			
			animationId = requestAnimationFrame(draw);
		}
		
		draw();
		
		return () => {
			cancelAnimationFrame(animationId);
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 1000;
	}
</style>
