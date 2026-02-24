const { execSync } = require('child_process');

// Wrapper that uses the environment's BRAVE_API_KEY and the Brave Search HTTP API.
// NOTE: In the local environment we prefer to call the OpenClaw web_search tool, but
// for the bot runtime we implement a simple fetch-based wrapper that calls Brave's
// REST API. Ensure BRAVE_API_KEY is set in env.

const fetch = require('node-fetch');

async function search(query, count = 3, ui_lang = 'ko-KR') {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error('BRAVE_API_KEY not set');
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&source=web&count=${count}&ui_lang=${ui_lang}`;
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
  // normalize to simple array of {title,url,description,siteName}
  const results = (json.results || []).slice(0, count).map(r => ({
    title: r.title || '',
    url: r.url,
    snippet: r.description || '',
    siteName: r.siteName || '',
    imageUrl: (r.thumbnail && (r.thumbnail.src || r.thumbnail.original)) || (r.image && (r.image.src || r.image.url)) || null
  }));
  return results;
}

module.exports = { search };
