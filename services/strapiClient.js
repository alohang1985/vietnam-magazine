// Use built-in global fetch (Node 18+ / 22)
const fetch = globalThis.fetch;

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
if (!STRAPI_URL || !STRAPI_TOKEN) {
  // don't throw on load; allow runtime checks
}

async function createPost(payload) {
  console.log('Strapi 저장 시도 중...', payload.title || payload);
  try {
    if (!STRAPI_URL || !STRAPI_TOKEN) throw new Error('STRAPI_URL or STRAPI_API_TOKEN not set');
    const url = `${STRAPI_URL.replace(/\/$/,'')}/api/posts`;
    // Ensure status published
    const dataPayload = Object.assign({}, payload, { status: 'published' });
    // Ensure hero_image component is sent as object when provided
    if (dataPayload.hero_image && typeof dataPayload.hero_image !== 'object') {
      // if a string was passed accidentally, wrap it
      dataPayload.hero_image = { source: 'brave', url: String(dataPayload.hero_image), photographer: '', license_url: '' };
    }
    const body = { data: dataPayload };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Strapi create post error ${res.status}: ${t}`);
    }
    const json = await res.json();
    console.log('Strapi 저장 완료:', JSON.stringify(json).slice(0,300));
    return json;
  } catch (err) {
    console.error('Strapi 저장 실패:', err.message);
    throw err;
  }
}

module.exports = { createPost };
