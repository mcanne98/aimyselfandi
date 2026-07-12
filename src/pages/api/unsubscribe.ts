import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
	const env = (locals as { runtime?: { env?: { subscribers_db?: D1Database } } }).runtime?.env;
	const db = env?.subscribers_db;

	const token = url.searchParams.get('token');
	if (!token) {
		return new Response(unsubscribePage('Invalid link', 'This unsubscribe link is missing a token. Please contact blog@cedricanne.com if you need help.', false), {
			status: 400,
			headers: { 'Content-Type': 'text/html' },
		});
	}

	if (!db) {
		return new Response(unsubscribePage('Error', 'Service unavailable. Please try again later.', false), {
			status: 503,
			headers: { 'Content-Type': 'text/html' },
		});
	}

	try {
		const result = await db
			.prepare('DELETE FROM subscribers WHERE unsubscribe_token = ?')
			.bind(token)
			.run();

		if (result.meta.changes === 0) {
			return new Response(unsubscribePage('Already unsubscribed', "You're not on the list, or you've already unsubscribed. No further action needed.", false), {
				status: 200,
				headers: { 'Content-Type': 'text/html' },
			});
		}

		return new Response(unsubscribePage('Unsubscribed', "You've been removed from the list. You won't receive any more emails from AI, Myself & I.", true), {
			status: 200,
			headers: { 'Content-Type': 'text/html' },
		});
	} catch (err) {
		console.error('Unsubscribe error:', err);
		return new Response(unsubscribePage('Error', 'Something went wrong. Please try again or contact blog@cedricanne.com.', false), {
			status: 500,
			headers: { 'Content-Type': 'text/html' },
		});
	}
};

function unsubscribePage(title: string, message: string, success: boolean): string {
	const color = success ? '#14B8A6' : '#94A3B8';
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — AI, Myself & I</title>
<style>
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: #0F172A; color: #fff; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .box { max-width: 440px; text-align: center; padding: 2rem; }
  .icon { font-size: 2.5rem; margin-bottom: 1.25rem; }
  h1 { font-size: 1.6rem; margin: 0 0 0.75rem; color: ${color}; }
  p { color: #94A3B8; line-height: 1.7; font-size: 0.95rem; margin: 0 0 1.5rem; }
  a { color: #14B8A6; text-decoration: none; font-size: 0.875rem; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="box">
  <div class="icon">${success ? '✓' : '○'}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="https://blog.cedricanne.com">← Back to the blog</a>
</div>
</body>
</html>`;
}
