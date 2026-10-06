import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
	const posts = await getCollection('blog');
	const [latest] = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	if (!latest) {
		return new Response(JSON.stringify({ error: 'No posts found.' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const body = {
		slug: latest.id,
		title: latest.data.title,
		description: latest.data.description,
		url: `https://blog.cedricanne.com/blog/${latest.id}/`,
		heroImage: latest.data.heroImage,
		series: latest.data.series,
		pubDate: latest.data.pubDate.toISOString(),
	};

	return new Response(JSON.stringify(body), {
		headers: { 'Content-Type': 'application/json' },
	});
};
