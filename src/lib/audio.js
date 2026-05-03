export function playTone(type) {
	if (typeof window === 'undefined') return;
	
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) return;
	
	const ctx = new AudioContext();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	
	osc.connect(gain);
	gain.connect(ctx.destination);
	
	if (type === 'correct') {
		osc.type = 'sine';
		osc.frequency.setValueAtTime(800, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
		
		gain.gain.setValueAtTime(0, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
		
		osc.start();
		osc.stop(ctx.currentTime + 0.3);
	} else if (type === 'wrong') {
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(200, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
		
		gain.gain.setValueAtTime(0, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
		
		osc.start();
		osc.stop(ctx.currentTime + 0.3);
	}
}
