const fetch = require('node-fetch');

async function searchUnsplash(query, apiKey, perPage=5) {
  if (!apiKey) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${apiKey}` } });
  const j = await res.json();
  return (j.results || []).map(r=>({ source:'unsplash', url: r.urls.full, photographer: r.user.name, license_url: 'https://unsplash.com' }));
}

async function searchPexels(query, apiKey, perPage=5) {
  if (!apiKey) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  const j = await res.json();
  return (j.photos || []).map(p=>({ source:'pexels', url: p.src.original, photographer: p.photographer, license_url: 'https://www.pexels.com' }));
}

module.exports = { searchUnsplash, searchPexels }
