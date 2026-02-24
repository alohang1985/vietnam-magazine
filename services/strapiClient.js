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
    // add timeout using AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    // log request/response for debugging
    console.log('Strapi POST URL:', url);
    console.log('Strapi POST body preview:', JSON.stringify(body).slice(0,1000));

    if (!res.ok) {
      const t = await res.text();
      console.error('Strapi create post failed:', res.status, t.slice(0,1000));
      // If slug uniqueness caused the failure, retry once with timestamp suffix
      try {
        const bodyJson = JSON.parse(JSON.stringify(body));
        if (t && t.includes('slug') && bodyJson && bodyJson.data && bodyJson.data.slug) {
          const oldSlug = bodyJson.data.slug;
          const newSlug = (String(oldSlug).slice(0,60) + '-' + Date.now()).slice(0,80);
          bodyJson.data.slug = newSlug;
          console.log('Retrying Strapi createPost with new slug:', newSlug);
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRAPI_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyJson)
          });
          if (retryRes.ok) {
            const retryJson = await retryRes.json();
            console.log('Strapi retry succeeded with new slug:', newSlug);
            return retryJson;
          } else {
            const retryText = await retryRes.text();
            console.error('Strapi retry failed:', retryRes.status, retryText.slice(0,1000));
          }
        }
      } catch (e) {
        console.warn('Retry logic error:', e.message);
      }
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
