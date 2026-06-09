import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env;
	const db = env?.DB;

	// Parse body
	let email: string | undefined;
	try {
		const body = await request.json() as { email?: unknown };
		email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Validate email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// DB not available (local dev without D1 binding)
	if (!db) {
		console.warn('D1 binding not found — skipping DB insert in local dev.');
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Insert into D1
	try {
		await db
			.prepare('INSERT INTO subscribers (email) VALUES (?)')
			.bind(email)
			.run();

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err: unknown) {
		// D1 unique constraint violation = already subscribed
		if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
			return new Response(JSON.stringify({ error: 'You are already subscribed.' }), {
				status: 409,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		console.error('Subscribe error:', err);
		return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
