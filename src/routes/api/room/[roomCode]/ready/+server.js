import { json } from '@sveltejs/kit';
import { rooms, broadcast } from '$lib/server/rooms.js';

export async function POST({ request, params }) {
	const roomCode = params.roomCode;
	const { isHost } = await request.json();
	
	const room = rooms.get(roomCode);
	if (!room) return json({ error: 'Room not found' }, { status: 404 });
	
	if (isHost && room.host) {
		room.host.ready = true;
	} else if (!isHost && room.guest) {
		room.guest.ready = true;
	}
	
	broadcast(roomCode, 'sync', {
		host: room.host,
		guest: room.guest,
		status: room.status,
		mode: room.mode
	});
	
	if (room.host?.ready && room.guest?.ready) {
		room.status = 'starting';
		broadcast(roomCode, 'start', { countdown: 3 });
	}
	
	return json({ success: true });
}
