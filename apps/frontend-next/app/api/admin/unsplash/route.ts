import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_KEY) return new Response(JSON.stringify({ error: 'missing UNSPLASH_ACCESS_KEY' }), { status: 500 });
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape`, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
    const j = await res.json();
    const results = (j.results || []).map((r:any) => ({ url: r.urls.regular, thumb: r.urls.thumb, credit: `Photo by ${r.user.name} on Unsplash`, creditLink: r.links.html, authorName: r.user.name }));
    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
