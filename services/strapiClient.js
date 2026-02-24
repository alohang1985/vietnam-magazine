const fetch = require('node-fetch');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
if (!STRAPI_URL || !STRAPI_TOKEN) {
  // don't throw on load; allow runtime checks
}

async function createPost(payload) {
  if (!STRAPI_URL || !STRAPI_TOKEN) throw new Error('STRAPI_URL or STRAPI_API_TOKEN not set');
  const url = `${STRAPI_URL.replace(/\/$/,'')}/api/posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: payload })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Strapi create post error ${res.status}: ${t}`);
  }
  const json = await res.json();
  return json;
}

module.exports = { createPost };
