import { json } from '@sveltejs/kit';
import { rooms, broadcast } from '$lib/server/rooms.js';

export async function POST({ request, params }) {
	const roomCode = params.roomCode;
	const { isHost, score, progress, finished, history } = await request.json();
	
	const room = rooms.get(roomCode);
	if (!room) return json({ error: 'Room not found' }, { status: 404 });
	
	if (isHost && room.host) {
		room.host.score = score !== undefined ? score : room.host.score;
		room.host.progress = progress !== undefined ? progress : room.host.progress;
		if (finished !== undefined) room.host.finished = finished;
		if (history !== undefined) room.host.history = history;
	} else if (!isHost && room.guest) {
		room.guest.score = score !== undefined ? score : room.guest.score;
		room.guest.progress = progress !== undefined ? progress : room.guest.progress;
		if (finished !== undefined) room.guest.finished = finished;
		if (history !== undefined) room.guest.history = history;
	}
	
	broadcast(roomCode, 'sync', {
		host: room.host,
		guest: room.guest,
		status: room.status,
		mode: room.mode,
		gameState: room.gameState
	});

	if (room.status !== 'done') {
		if (room.host?.finished && room.guest?.finished) {
			room.status = 'done';
			broadcast(roomCode, 'game_over', { winner: null });
		}
	}
	
	return json({ success: true });
}
