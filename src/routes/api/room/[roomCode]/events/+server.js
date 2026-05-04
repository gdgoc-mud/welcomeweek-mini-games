import { rooms } from '$lib/server/rooms.js';

export function GET({ params }) {
	const roomCode = params.roomCode;
	const room = rooms.get(roomCode);
	
	if (!room) {
		return new Response('Room not found', { status: 404 });
	}

	const stream = new ReadableStream({
		start(controller) {
			room.clients.add(controller);
			
			// Send initial state
			const state = {
				host: room.host,
				guest: room.guest,
				status: room.status,
				mode: room.mode,
				gameState: room.gameState
			};
			controller.enqueue(`event: sync\ndata: ${JSON.stringify(state)}\n\n`);
		},
		cancel(controller) {
			room.clients.delete(controller);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}
