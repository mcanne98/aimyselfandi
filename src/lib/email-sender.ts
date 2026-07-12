export interface Subscriber {
	email: string;
	unsubscribe_token: string;
}

export interface ArticleData {
	title: string;
	description: string;
	url: string;
	heroImage?: string;
	series?: string;
	pubDate: string;
}

export function buildEmailHtml(article: ArticleData, subscriber: Subscriber): string {
	const unsubUrl = `https://blog.cedricanne.com/api/unsubscribe?token=${subscriber.unsubscribe_token}`;
	const heroImgTag = article.heroImage
		? `<img src="https://blog.cedricanne.com${article.heroImage}" alt="${escHtml(article.title)}" width="560" style="width:100%;max-width:560px;height:auto;display:block;border-radius:8px 8px 0 0;">`
		: '';
	const seriesTag = article.series
		? `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#14B8A6;">${escHtml(article.series)}</p>`
		: '';

	return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escHtml(article.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">${escHtml(article.description)}</div>

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Card -->
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

    <!-- Header -->
    <tr>
      <td style="background:#0F172A;padding:20px 28px;border-radius:12px 12px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">AI, Myself &amp; I</p>
              <p style="margin:4px 0 0;font-size:11px;color:#14B8A6;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;">by Cedric Anne · Weekly Newsletter</p>
            </td>
            <td align="right">
              <a href="https://blog.cedricanne.com" style="font-size:11px;color:#94A3B8;text-decoration:none;">blog.cedricanne.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Hero image -->
    ${heroImgTag ? `<tr><td style="background:#1E293B;">${heroImgTag}</td></tr>` : ''}

    <!-- Body -->
    <tr>
      <td style="background:#ffffff;padding:36px 36px 28px;">
        ${seriesTag}
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#0F172A;font-weight:700;letter-spacing:-0.02em;">${escHtml(article.title)}</h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#475569;font-weight:400;">${escHtml(article.description)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#14B8A6;border-radius:8px;">
              <a href="${article.url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#0F172A;text-decoration:none;">Read the full article →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="background:#ffffff;padding:0 36px;">
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;">
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#ffffff;padding:20px 36px 28px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;line-height:1.6;">
          You're receiving this because you subscribed at <a href="https://blog.cedricanne.com" style="color:#14B8A6;text-decoration:none;">blog.cedricanne.com</a>.
        </p>
        <p style="margin:0;font-size:12px;color:#94A3B8;">
          <a href="${unsubUrl}" style="color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="https://blog.cedricanne.com" style="color:#94A3B8;text-decoration:none;">Visit the blog</a>
          &nbsp;·&nbsp;
          <a href="https://www.linkedin.com/in/cedricanne/" style="color:#94A3B8;text-decoration:none;">LinkedIn</a>
        </p>
      </td>
    </tr>

    <!-- Spacer -->
    <tr><td style="height:24px;"></td></tr>

  </table>
</td></tr>
</table>

</body>
</html>`;
}

export function buildEmailText(article: ArticleData, subscriber: Subscriber): string {
	const unsubUrl = `https://blog.cedricanne.com/api/unsubscribe?token=${subscriber.unsubscribe_token}`;
	return `AI, Myself & I — by Cedric Anne

${article.title}
${article.series ? `Series: ${article.series}\n` : ''}
${article.description}

Read the full article: ${article.url}

---
You're receiving this because you subscribed at blog.cedricanne.com.
Unsubscribe: ${unsubUrl}
`;
}

function escHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
