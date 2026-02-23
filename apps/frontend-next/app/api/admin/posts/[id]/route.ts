import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }) {
  try {
    const id = params.id;
    const body = await req.json();
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
    const STRAPI_URL = process.env.STRAPI_URL;
    if (!STRAPI_API_TOKEN || !STRAPI_URL) return new Response(JSON.stringify({ error: 'missing server config' }), { status: 500 });

    const data: { data: Record<string, unknown> } = { data: {} };
    if (body.title) data.data.title = body.title;
    if (body.article_markdown) data.data.article_markdown = body.article_markdown;
    if (body.category) data.data.category = body.category;

    const res = await fetch(`${STRAPI_URL}/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_API_TOKEN}` },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: 'update failed', detail: json }), { status: 500 });
    return new Response(JSON.stringify(json), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }) {
  try {
    const id = params.id;
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
    const STRAPI_URL = process.env.STRAPI_URL;
    if (!STRAPI_API_TOKEN || !STRAPI_URL) return new Response(JSON.stringify({ error: 'missing server config' }), { status: 500 });

    const res = await fetch(`${STRAPI_URL}/api/posts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
    });
    const json = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: 'delete failed', detail: json }), { status: 500 });
    return new Response(JSON.stringify({ message: 'deleted', detail: json }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
