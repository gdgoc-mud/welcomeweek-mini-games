import { json } from '@sveltejs/kit';
import { rooms, broadcast } from '$lib/server/rooms.js';

export async function POST({ request, params }) {
	const roomCode = params.roomCode;
	const { isHost, action, payload } = await request.json();
	
	const room = rooms.get(roomCode);
	if (!room) return json({ error: 'Room not found' }, { status: 404 });
	
	// Generic ready logic for arcade games
	if (action === 'ready' && room.gameState) {
		if (isHost) room.gameState.hostReady = true;
		else room.gameState.guestReady = true;
		
		if (room.gameState.hostReady && room.gameState.guestReady) {
			room.gameState.started = true;
		}
	}
	
	// Handle different game mode actions
	if (room.mode === 'merge' && action === 'click') {
		if (!room.gameState.started) return json({ success: false, message: 'Game not started' });
		const { index } = payload;
		if (index >= 0 && index < 36) {
			const targetVal = isHost ? 1 : 2;
			// 1-click steal
			room.gameState.grid[index] = targetVal;
		}
	} 
	else if (room.mode === 'ddos' && action === 'type') {
		if (!room.gameState.started) return json({ success: false, message: 'Game not started' });
		const { amount } = payload; // positive for host, negative for guest
		room.gameState.position += amount;
		// clamp between -100 and 100
		if (room.gameState.position > 100) room.gameState.position = 100;
		if (room.gameState.position < -100) room.gameState.position = -100;
	}
	else if (room.mode === 'bug' && action === 'spawn' && isHost) {
		if (!room.gameState.started) return json({ success: false, message: 'Game not started' });
		// Only host dictates spawns to keep it synced
		room.gameState.bugs.push(payload);
	}
	else if (room.mode === 'bug' && action === 'squash') {
		if (!room.gameState.started) return json({ success: false, message: 'Game not started' });
		const { id } = payload;
		const bugIndex = room.gameState.bugs.findIndex(b => b.id === id);
		if (bugIndex !== -1) {
			room.gameState.bugs.splice(bugIndex, 1);
			if (isHost) room.host.score += 100;
			else room.guest.score += 100;
		}
	}
	
	// Broadcast updated state
	broadcast(roomCode, 'sync', {
		host: room.host,
		guest: room.guest,
		status: room.status,
		mode: room.mode,
		gameState: room.gameState
	});
	
	return json({ success: true });
}