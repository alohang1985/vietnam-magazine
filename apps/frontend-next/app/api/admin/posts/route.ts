import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
    const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_CMS_URL;
    if (!STRAPI_API_TOKEN || !STRAPI_URL) return new Response(JSON.stringify({ error: 'missing server config' }), { status: 500 });

    // Sort by publishedAt descending
    const res = await fetch(`${STRAPI_URL}/api/posts?pagination[limit]=50&sort=publishedAt:desc`, {
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
    });
    const json = await res.json();
    return new Response(JSON.stringify(json), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
