import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = body.content || '';
    if (!content || content.length < 20) return new Response(JSON.stringify({ error: 'content required' }), { status: 400 });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
    const STRAPI_URL = process.env.STRAPI_URL;

    if (!GEMINI_API_KEY || !STRAPI_API_TOKEN || !STRAPI_URL) {
      return new Response(JSON.stringify({ error: 'missing server config' }), { status: 500 });
    }

    // Call Gemini to generate post JSON
    const prompt = `You must respond with ONLY a valid JSON object. No markdown, no code blocks, no backticks. Just raw JSON. User provided content about a Vietnam travel topic: """ ${content} """ Your job: 1. Analyze the content above 2. Rewrite it as a Korean travel magazine article 3. Keep all real information (prices, menus, locations, tips) from the original 4. Add a Google Maps link for the main place: [지도에서 보기](https://maps.google.com/?q=PLACE_NAME+CITY_NAME+Vietnam) 5. Use ## headings in markdown 6. Friendly Korean tone 7. End with 💡 여행 꿀팁 section Return ONLY this JSON (no backticks, no extra text): {"title":"한국어 제목","slug":"english-slug-only","category":"city","content":"markdown content here"} category must be one of: phu-quoc, nha-trang, da-nang, ho-chi-minh, hanoi, ha-long, dalat, hoi-an, sapa, mui-ne`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192, temperature: 0.5 } })
    });
    const geminiJson = await geminiRes.json();
    const raw = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to extract JSON object from raw text
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      // fallback: find first {...}
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error('Failed to parse Gemini response');
    }

    // Validate category
    const ALLOWED = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];
    if (!parsed.category || !ALLOWED.includes(parsed.category)) parsed.category = 'ho-chi-minh';

    // Upload to Strapi
    const slug = (parsed.slug + '-' + Date.now()).replace(/[^A-Za-z0-9\-_.~]/g, '').toLowerCase();
    const article = parsed.content;

    const uploadRes = await fetch(`${STRAPI_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_API_TOKEN}` },
      body: JSON.stringify({ data: { title: parsed.title, slug, category: parsed.category, article_markdown: article, published_at: new Date().toISOString() } })
    });

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      return new Response(JSON.stringify({ error: 'Strapi upload failed', detail: uploadJson }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Post created', post: uploadJson }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
