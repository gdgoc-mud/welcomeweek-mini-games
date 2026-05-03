import fs from 'fs';
import path from 'path';

export async function GET() {
	const dataPath = path.resolve('static/leaderboard.json');
	const data = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '[]';
	
	return new Response(data, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="leaderboard.json"'
		}
	});
}
