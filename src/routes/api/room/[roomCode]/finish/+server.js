import { json } from '@sveltejs/kit';
import { rooms, broadcast } from '$lib/server/rooms.js';

export async function POST({ request, params }) {
	const roomCode = params.roomCode;
	const { isHost } = await request.json();
	
	const room = rooms.get(roomCode);
	if (!room) return json({ error: 'Room not found' }, { status: 404 });
	
	room.status = 'done';
	
	// Broadcast game over for Sprint mode - the person who called this is the winner
	broadcast(roomCode, 'game_over', { winnerIsHost: isHost });
	
	return json({ success: true });
}
