export const rooms = new Map();

// Room state structure:
// {
//   host: { name: 'Player 1', ready: false, score: 0, progress: 0 },
//   guest: { name: 'Player 2', ready: false, score: 0, progress: 0 },
//   status: 'waiting', // waiting, starting, playing, done
//   mode: 'trivia',
//   createdAt: Date.now(),
//   clients: new Set() // stores SSE controllers
// }

export function cleanupRooms() {
	const now = Date.now();
	for (const [code, room] of rooms.entries()) {
		if (now - room.createdAt > 30 * 60 * 1000) {
			rooms.delete(code);
		}
	}
}

export function broadcast(roomCode, event, data) {
	const room = rooms.get(roomCode);
	if (!room) return;
	
	const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	room.clients.forEach(controller => {
		try {
			controller.enqueue(message);
		} catch (e) {
			console.error("Error sending to client:", e);
			room.clients.delete(controller);
		}
	});
}
