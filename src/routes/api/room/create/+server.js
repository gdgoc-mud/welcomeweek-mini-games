import { json } from '@sveltejs/kit';
import { rooms, cleanupRooms } from '$lib/server/rooms.js';

function generateCode() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 4; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

export async function POST({ request }) {
	cleanupRooms();
	const { name, mode } = await request.json();
	
	let code = generateCode();
	while (rooms.has(code)) {
		code = generateCode();
	}
	
	rooms.set(code, {
		host: { name, ready: false, score: 0, progress: 0, finished: false, history: [] },
		guest: null,
		status: 'waiting',
		mode,
		createdAt: Date.now(),
		clients: new Set()
	});
	
	return json({ code });
}
