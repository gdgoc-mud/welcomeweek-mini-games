import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dataPath = path.resolve('static/leaderboard.json');

function readLeaderboard() {
	if (!fs.existsSync(dataPath)) {
		fs.writeFileSync(dataPath, JSON.stringify([]));
	}
	const data = fs.readFileSync(dataPath, 'utf8');
	return JSON.parse(data);
}

function writeLeaderboard(data) {
	fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export async function GET() {
	const leaderboard = readLeaderboard();
	leaderboard.sort((a, b) => b.score - a.score);
	return json(leaderboard);
}

export async function POST({ request }) {
	const body = await request.json();
	const leaderboard = readLeaderboard();
	
	const existing = leaderboard.find(e => e.name === body.name && e.mode === body.mode);
	if (existing) {
		return json({ error: "You've already submitted a score for this mode. Check the leaderboard!" }, { status: 409 });
	}
	
	const newEntry = {
		id: crypto.randomUUID(),
		name: body.name,
		mode: body.mode,
		score: body.score,
		playerCount: body.playerCount || 1,
		opponent: body.opponent || null,
		timestamp: new Date().toISOString()
	};
	
	leaderboard.push(newEntry);
	writeLeaderboard(leaderboard);
	
	return json(leaderboard);
}

export async function PUT({ request }) {
	const body = await request.json();
	const leaderboard = readLeaderboard();
	
	for (const entry of body) {
		if (!entry.name || !entry.mode || entry.score === undefined) continue;
		
		leaderboard.push({
			id: entry.id || crypto.randomUUID(),
			name: entry.name,
			mode: entry.mode,
			score: entry.score,
			playerCount: entry.playerCount || 1,
			opponent: entry.opponent || null,
			timestamp: entry.timestamp || new Date().toISOString()
		});
	}
	
	writeLeaderboard(leaderboard);
	return json({ success: true, count: body.length });
}

export async function DELETE({ request }) {
	const url = new URL(request.url);
	const id = url.searchParams.get('id');
	
	if (id) {
		let leaderboard = readLeaderboard();
		leaderboard = leaderboard.filter(e => e.id !== id);
		writeLeaderboard(leaderboard);
		return json({ success: true });
	} else {
		// Clear all
		writeLeaderboard([]);
		return json({ success: true });
	}
}
