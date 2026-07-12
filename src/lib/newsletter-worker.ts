import { buildEmailHtml, buildEmailText } from './email-sender';
import type { Subscriber, ArticleData } from './email-sender';

interface Env {
	subscribers_db: D1Database;
	RESEND_API_KEY: string;
	LATEST_ARTICLE_TITLE?: string;
	LATEST_ARTICLE_DESCRIPTION?: string;
	LATEST_ARTICLE_URL?: string;
	LATEST_ARTICLE_HERO?: string;
	LATEST_ARTICLE_SERIES?: string;
	LATEST_ARTICLE_DATE?: string;
}

// Called by Cloudflare Cron Trigger every Monday at 8am EST (13:00 UTC)
export async function handleScheduled(env: Env): Promise<void> {
	const db = env.subscribers_db;
	const resendKey = env.RESEND_API_KEY;

	if (!resendKey) {
		console.error('RESEND_API_KEY not set — aborting newsletter send.');
		return;
	}

	// Article data must be provided via env vars set before each send
	// (set these in Cloudflare dashboard or via wrangler secret before each Monday)
	const article: ArticleData = {
		title: env.LATEST_ARTICLE_TITLE ?? '',
		description: env.LATEST_ARTICLE_DESCRIPTION ?? '',
		url: env.LATEST_ARTICLE_URL ?? 'https://blog.cedricanne.com/blog',
		heroImage: env.LATEST_ARTICLE_HERO,
		series: env.LATEST_ARTICLE_SERIES,
		pubDate: env.LATEST_ARTICLE_DATE ?? new Date().toISOString(),
	};

	if (!article.title || !article.url) {
		console.error('No article configured for this week — set LATEST_ARTICLE_TITLE and LATEST_ARTICLE_URL env vars.');
		return;
	}

	// Fetch all subscribers and assign tokens if missing
	const { results } = await db
		.prepare('SELECT email, unsubscribe_token FROM subscribers')
		.all<{ email: string; unsubscribe_token: string | null }>();

	if (!results || results.length === 0) {
		console.log('No subscribers found.');
		return;
	}

	console.log(`Sending to ${results.length} subscribers…`);

	let sent = 0;
	let failed = 0;

	for (const row of results) {
		// Generate token if subscriber doesn't have one yet
		let token = row.unsubscribe_token;
		if (!token) {
			token = crypto.randomUUID();
			await db
				.prepare('UPDATE subscribers SET unsubscribe_token = ? WHERE email = ?')
				.bind(token, row.email)
				.run();
		}

		const subscriber: Subscriber = { email: row.email, unsubscribe_token: token };

		try {
			const res = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${resendKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: 'Cedric Anne <blog@cedricanne.com>',
					to: subscriber.email,
					subject: article.title,
					html: buildEmailHtml(article, subscriber),
					text: buildEmailText(article, subscriber),
				}),
			});

			if (res.ok) {
				sent++;
			} else {
				const err = await res.text();
				console.error(`Failed to send to ${subscriber.email}: ${err}`);
				failed++;
			}
		} catch (err) {
			console.error(`Error sending to ${subscriber.email}:`, err);
			failed++;
		}

		// Rate limit: Resend allows 10 req/sec on free tier — add small delay
		await new Promise(r => setTimeout(r, 120));
	}

	console.log(`Newsletter sent: ${sent} delivered, ${failed} failed.`);
}
