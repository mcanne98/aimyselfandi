interface Env {
	subscribers_db: D1Database;
	RESEND_API_KEY: string;
	ARTICLE_TITLE: string;
	ARTICLE_DESCRIPTION: string;
	ARTICLE_URL: string;
	ARTICLE_HERO?: string;
	ARTICLE_SERIES?: string;
}

export default {
	// Cron trigger: every Monday at 8:00am EST (13:00 UTC)
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(sendNewsletter(env, false));
	},

	// HTTP handler for manual trigger (POST /trigger with Authorization header)
	// Add ?force=true to bypass the duplicate-send check
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}
		const auth = request.headers.get('Authorization');
		if (!auth || auth !== `Bearer ${env.RESEND_API_KEY}`) {
			return new Response('Unauthorized', { status: 401 });
		}
		const force = new URL(request.url).searchParams.get('force') === 'true';
		const result = await sendNewsletter(env, force);
		return new Response(JSON.stringify({ ok: true, result }), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
};

async function sendNewsletter(env: Env, force = false): Promise<string> {
	const { subscribers_db: db, RESEND_API_KEY: apiKey } = env;

	if (!apiKey) {
		console.error('RESEND_API_KEY not configured.');
		return 'error: RESEND_API_KEY not set';
	}

	const article = {
		title: env.ARTICLE_TITLE ?? '',
		description: env.ARTICLE_DESCRIPTION ?? '',
		url: env.ARTICLE_URL ?? '',
		heroImage: env.ARTICLE_HERO,
		series: env.ARTICLE_SERIES,
	};

	if (!article.title || !article.url) {
		console.error('Article not configured. Set ARTICLE_TITLE and ARTICLE_URL secrets.');
		return 'error: article secrets not configured';
	}

	// Ensure tracking tables exist
	await db.exec("CREATE TABLE IF NOT EXISTS newsletter_sent (id INTEGER PRIMARY KEY AUTOINCREMENT, article_url TEXT UNIQUE NOT NULL, sent_at TEXT NOT NULL DEFAULT (datetime('now')))");
	await db.exec("CREATE TABLE IF NOT EXISTS send_log (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, article_url TEXT NOT NULL, status TEXT NOT NULL, sent_at TEXT NOT NULL DEFAULT (datetime('now')))");

	// Check if this article has already been sent
	if (!force) {
		const already = await db
			.prepare('SELECT id FROM newsletter_sent WHERE article_url = ?')
			.bind(article.url)
			.first<{ id: number }>();

		if (already) {
			console.log(`Article already sent: ${article.url} — skipping.`);
			return `skipped: already sent "${article.title}"`;
		}
	}

	// Fetch all subscribers
	const { results } = await db
		.prepare('SELECT email, unsubscribe_token FROM subscribers')
		.all<{ email: string; unsubscribe_token: string | null }>();

	if (!results?.length) {
		console.log('No subscribers.');
		return;
	}

	console.log(`Sending newsletter to ${results.length} subscribers…`);
	let sent = 0;
	let failed = 0;
	const delivered: string[] = [];
	const failedList: string[] = [];

	for (const row of results) {
		// Assign unsubscribe token on first send if missing
		let token = row.unsubscribe_token;
		if (!token) {
			token = crypto.randomUUID();
			await db
				.prepare('UPDATE subscribers SET unsubscribe_token = ? WHERE email = ?')
				.bind(token, row.email)
				.run();
		}

		const unsubUrl = `https://blog.cedricanne.com/api/unsubscribe?token=${token}`;

		try {
			const res = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: 'Cedric Anne <blog@cedricanne.com>',
					to: row.email,
					subject: article.title,
					html: buildHtml(article, unsubUrl),
					text: buildText(article, unsubUrl),
				}),
			});

			if (res.ok) {
				sent++;
				delivered.push(row.email);
				await db
					.prepare('INSERT INTO send_log (email, article_url, status) VALUES (?, ?, ?)')
					.bind(row.email, article.url, 'sent')
					.run();
			} else {
				const errText = await res.text();
				console.error(`Send failed for ${row.email}:`, errText);
				failed++;
				failedList.push(row.email);
				await db
					.prepare('INSERT INTO send_log (email, article_url, status) VALUES (?, ?, ?)')
					.bind(row.email, article.url, 'failed')
					.run();
			}
		} catch (err) {
			console.error(`Error for ${row.email}:`, err);
			failed++;
			failedList.push(row.email);
			await db
				.prepare('INSERT INTO send_log (email, article_url, status) VALUES (?, ?, ?)')
				.bind(row.email, article.url, 'error')
				.run();
		}

		// Stay within Resend free-tier rate limit (10 req/sec)
		await new Promise(r => setTimeout(r, 120));
	}

	// Record this article as sent so the cron won't resend it next week
	if (sent > 0) {
		await db
			.prepare('INSERT OR REPLACE INTO newsletter_sent (article_url) VALUES (?)')
			.bind(article.url)
			.run();
	}

	// Send delivery summary to mcanne98@gmail.com
	try {
		const sentAt = new Date().toUTCString();
		const deliveredRows = delivered.map((e, i) => `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};"><td style="padding:6px 12px;font-size:13px;color:#0F172A;">${esc(e)}</td><td style="padding:6px 12px;font-size:13px;color:#16a34a;text-align:center;">✓ Sent</td></tr>`).join('');
		const failedRows = failedList.map((e, i) => `<tr style="background:${i % 2 === 0 ? '#fef2f2' : '#ffffff'};"><td style="padding:6px 12px;font-size:13px;color:#0F172A;">${esc(e)}</td><td style="padding:6px 12px;font-size:13px;color:#dc2626;text-align:center;">✗ Failed</td></tr>`).join('');

		const summaryHtml = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<div style="background:#0F172A;padding:20px 28px;">
  <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">Newsletter Delivery Summary</p>
  <p style="margin:4px 0 0;font-size:12px;color:#14B8A6;">AI, Myself &amp; I · ${sentAt}</p>
</div>
<div style="padding:24px 28px;">
  <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Article:</strong> ${esc(article.title)}</p>
  <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>URL:</strong> <a href="${article.url}" style="color:#14B8A6;">${article.url}</a></p>
  <p style="margin:0 0 20px;font-size:14px;color:#475569;"><strong>Total:</strong> ${results.length} subscribers &nbsp;|&nbsp; <span style="color:#16a34a;">${sent} sent</span>${failed > 0 ? ` &nbsp;|&nbsp; <span style="color:#dc2626;">${failed} failed</span>` : ''}</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr style="background:#0F172A;"><th style="padding:8px 12px;font-size:12px;color:#94A3B8;text-align:left;font-weight:500;">Subscriber</th><th style="padding:8px 12px;font-size:12px;color:#94A3B8;text-align:center;font-weight:500;">Status</th></tr></thead>
    <tbody>${deliveredRows}${failedRows}</tbody>
  </table>
</div>
</div>
</body></html>`;

		const summaryText = `Newsletter Delivery Summary\n${sentAt}\n\nArticle: ${article.title}\nURL: ${article.url}\nTotal: ${results.length} | Sent: ${sent} | Failed: ${failed}\n\nDelivered to:\n${delivered.map(e => `  ✓ ${e}`).join('\n')}${failedList.length > 0 ? `\n\nFailed:\n${failedList.map(e => `  ✗ ${e}`).join('\n')}` : ''}`;

		await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: 'Cedric Anne <blog@cedricanne.com>',
				to: 'mcanne98@gmail.com',
				subject: `[Newsletter Summary] ${article.title} — ${sent}/${results.length} delivered`,
				html: summaryHtml,
				text: summaryText,
			}),
		});
	} catch (err) {
		console.error('Failed to send delivery summary:', err);
	}

	const summary = `Done. Sent: ${sent}, Failed: ${failed}`;
	console.log(summary);
	return summary;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(article: { title: string; description: string; url: string; heroImage?: string; series?: string }, unsubUrl: string): string {
	const heroTag = article.heroImage
		? `<tr><td style="background:#1E293B;"><img src="https://blog.cedricanne.com${article.heroImage}" alt="${esc(article.title)}" width="560" style="width:100%;max-width:560px;height:auto;display:block;"></td></tr>`
		: '';
	const seriesTag = article.series
		? `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#14B8A6;">${esc(article.series)}</p>`
		: '';

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(article.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">${esc(article.description)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#0F172A;padding:20px 28px;border-radius:12px 12px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td>
          <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">AI, Myself &amp; I</p>
          <p style="margin:4px 0 0;font-size:11px;color:#14B8A6;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;">by Cedric Anne &middot; Weekly Newsletter</p>
        </td>
        <td align="right"><a href="https://blog.cedricanne.com" style="font-size:11px;color:#94A3B8;text-decoration:none;">blog.cedricanne.com</a></td>
      </tr></table>
    </td>
  </tr>

  <!-- Hero image -->
  ${heroTag}

  <!-- Body -->
  <tr>
    <td style="background:#ffffff;padding:36px 36px 28px;">
      ${seriesTag}
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#0F172A;font-weight:700;letter-spacing:-0.02em;">${esc(article.title)}</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#475569;">${esc(article.description)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#14B8A6;border-radius:8px;">
          <a href="${article.url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#0F172A;text-decoration:none;">Read the full article →</a>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="background:#ffffff;padding:0 36px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#ffffff;padding:20px 36px 28px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;line-height:1.6;">
        You're receiving this because you subscribed at <a href="https://blog.cedricanne.com" style="color:#14B8A6;text-decoration:none;">blog.cedricanne.com</a>.
      </p>
      <p style="margin:0;font-size:12px;color:#94A3B8;">
        <a href="${unsubUrl}" style="color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
        &nbsp;&middot;&nbsp;
        <a href="https://blog.cedricanne.com" style="color:#94A3B8;text-decoration:none;">Visit the blog</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.linkedin.com/in/cedricanne/" style="color:#94A3B8;text-decoration:none;">LinkedIn</a>
      </p>
    </td>
  </tr>

  <tr><td style="height:24px;"></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildText(article: { title: string; description: string; url: string; series?: string }, unsubUrl: string): string {
	return `AI, Myself & I — by Cedric Anne
${article.series ? `Series: ${article.series}\n` : ''}
${article.title}

${article.description}

Read the full article:
${article.url}

---
You're receiving this because you subscribed at blog.cedricanne.com.
Unsubscribe: ${unsubUrl}
`;
}
