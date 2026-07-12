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
		ctx.waitUntil(sendNewsletter(env));
	},

	// HTTP handler for manual trigger (POST /trigger with Authorization header)
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}
		const auth = request.headers.get('Authorization');
		if (!auth || auth !== `Bearer ${env.RESEND_API_KEY}`) {
			return new Response('Unauthorized', { status: 401 });
		}
		await sendNewsletter(env);
		return new Response(JSON.stringify({ ok: true }), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
};

async function sendNewsletter(env: Env): Promise<void> {
	const { subscribers_db: db, RESEND_API_KEY: apiKey } = env;

	if (!apiKey) {
		console.error('RESEND_API_KEY not configured.');
		return;
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
		return;
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
			} else {
				console.error(`Send failed for ${row.email}:`, await res.text());
				failed++;
			}
		} catch (err) {
			console.error(`Error for ${row.email}:`, err);
			failed++;
		}

		// Stay within Resend free-tier rate limit (10 req/sec)
		await new Promise(r => setTimeout(r, 120));
	}

	console.log(`Done. Sent: ${sent}, Failed: ${failed}`);
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
