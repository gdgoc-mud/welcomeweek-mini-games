import { json } from '@sveltejs/kit';

export async function GET() {
	const hostIp = process.env.PUBLIC_HOST_IP || 'localhost';
	return json({ hostIp });
}
