import { json } from '@sveltejs/kit';
import { rooms, broadcast } from '$lib/server/rooms.js';

export async function POST({ request, params }) {
	const roomCode = params.roomCode;
	const { name } = await request.json();
	
	const room = rooms.get(roomCode);
	
	if (!room) {
		return json({ error: 'Room not found' }, { status: 404 });
	}
	
	if (room.guest) {
		return json({ error: 'Room is full' }, { status: 403 });
	}
	
	room.guest = { name, ready: false, score: 0, progress: 0, finished: false, history: [] };
	
	broadcast(roomCode, 'sync', {
		host: room.host,
		guest: room.guest,
		status: room.status,
		mode: room.mode
	});
	
	return json({ success: true, mode: room.mode });
}
