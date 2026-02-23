import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = body.password;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return new Response(JSON.stringify({ error: 'server not configured' }), { status: 500 });
    if (!password) return new Response(JSON.stringify({ error: 'password required' }), { status: 400 });
    if (password === ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: false, message: '접근 거부' }), { status: 401 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
