import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
    const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_CMS_URL;
    if (!STRAPI_API_TOKEN || !STRAPI_URL) return new Response(JSON.stringify({ error: 'missing server config' }), { status: 500 });

    const formData = await req.formData();
    const file = formData.get('files');
    if (!file) return new Response(JSON.stringify({ error: 'file required' }), { status: 400 });

    // forward to Strapi upload
    const fd = new FormData();
    // @ts-ignore
    fd.append('files', file as any);

    const res = await fetch(`${STRAPI_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` }, body: fd });
    const j = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: 'upload failed', detail: j }), { status: 500 });
    // Strapi returns array of uploaded files
    const url = j && j[0] && (j[0].url || (j[0].data && j[0].data.attributes && j[0].data.attributes.url));
    return new Response(JSON.stringify({ url, detail: j }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
