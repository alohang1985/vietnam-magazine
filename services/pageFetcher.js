const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Fetch URL and extract main textual content (conservative: article/body text only).
// Images are intentionally excluded per request.

async function fetchText(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Heuristics to find article content
    const selectors = ['article', 'main', '#content', '.article', '.post', '.entry-content'];
    let text = '';
    for (const sel of selectors) {
      if ($(sel).length) {
        text = $(sel).text();
        if (text && text.trim().length > 200) break;
      }
    }
    if (!text || text.trim().length < 200) {
      // fallback: use body text
      text = $('body').text();
    }
    // collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    console.log('페이지 본문 길이:', text.length, 'URL:', url);
    return text;
  } finally {
    clearTimeout(id);
  }
}

module.exports = { fetchText };
