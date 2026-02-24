const { execSync } = require('child_process');

// Wrapper that uses the environment's BRAVE_API_KEY and the Brave Search HTTP API.
// NOTE: In the local environment we prefer to call the OpenClaw web_search tool, but
// for the bot runtime we implement a simple fetch-based wrapper that calls Brave's
// REST API. Ensure BRAVE_API_KEY is set in env.

// Node 18+ (Node 22) includes global fetch; no node-fetch required
const fetch = globalThis.fetch;

async function search(query, count = 3, ui_lang = 'ko-KR') {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error('BRAVE_API_KEY not set');
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&source=web&count=${count}&ui_lang=${ui_lang}&freshness=py`;
  const headers = {
    'Accept': 'application/json',
    'X-Subscription-Token': key
  };
  console.log('Brave 요청 URL:', url);
  console.log('Brave 요청 헤더:', headers);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brave Search error ${res.status}: ${text}`);
  }
  const json = await res.json();
  // Try to fetch image search results for higher-quality images
  let imageMap = {};
  try {
    const imgUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=3&ui_lang=${ui_lang}`;
    const imgRes = await fetch(imgUrl, { headers });
    if (imgRes.ok) {
      const imgJson = await imgRes.json();
      (imgJson.results || []).forEach(img => {
        // properties.url is preferred (high-quality original), fallback to thumbnail.src
        const key = img.sourceUrl || img.hostPageUrl || img.query || query;
        const hi = img.properties && img.properties.url ? img.properties.url : (img.thumbnail && img.thumbnail.src) || null;
        if (hi) imageMap[img.hostPageUrl || img.sourceUrl || img.query || ''] = hi;
      });
    }
  } catch (e) {
    console.warn('Brave image search failed:', e.message);
  }

  // normalize to simple array of {title,url,description,siteName}
  const results = (json.results || []).slice(0, count).map(r => {
    const host = r.url || '';
    // try to find matching image by host
    const imageUrl = imageMap[host] || (r.thumbnail && (r.thumbnail.src)) || (r.image && (r.image.src || r.image.url)) || null;
    const imageOriginal = host || (r.thumbnail && r.thumbnail.original) || (r.image && r.image.original) || null;
    return {
      title: r.title || '',
      url: r.url,
      snippet: r.description || '',
      siteName: r.siteName || '',
      imageUrl,
      imageOriginal
    };
  });
  return results;
}

module.exports = { search };
