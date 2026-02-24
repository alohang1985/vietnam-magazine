// Simple post generator: takes title hint + array of sources [{title,url,snippet,text}]
// Produces {title, summary_5lines, content}

function makeTitle(query, sources) {
  // Use query-based title with short suffix
  const base = query.replace(/\s+/g, ' ').trim();
  return `${base} — 호치민 추천 맛집 가이드`;
}

function makeSummary(sources) {
  // Compose up to 5 short lines (sentences)
  const lines = [];
  for (const s of sources) {
    if (s.snippet) lines.push(s.snippet.replace(/\s+/g, ' ').trim());
    if (lines.length >= 5) break;
  }
  while (lines.length < 5) lines.push('자세한 내용은 본문을 확인하세요.');
  return lines.slice(0,5).join(' ');
}

function makeContent(sources) {
  // Create magazine-style intro + per-source section with a short rewrite.
  let content = '';
  content += `<p>호치민 여행자들을 위한 엄선된 맛집 가이드입니다. 아래는 실시간 검색 상위 결과를 바탕으로 요약·재구성한 정보입니다.</p>`;
  for (let i=0;i<sources.length;i++){
    const s = sources[i];
    content += `<h2>${i+1}. ${s.title || s.siteName || '추천 맛집'}</h2>`;
    const excerpt = s.text ? s.text.slice(0,800) : (s.snippet || '상세 내용은 원문을 참고하세요.');
    content += `<p>${excerpt}</p>`;
    content += `<p><a href="${s.url}">원문 보기</a> — 출처: ${s.siteName || s.url}</p>`;
  }
  return content;
}

function slugify(text){
  const s = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  return s || '';
}

function toMarkdown(sources, query) {
  // Intro
  let md = `호치민 여행자들을 위한 엄선된 가이드입니다. 아래는 실시간 검색 상위 결과를 바탕으로 요약·재구성한 정보입니다.\n\n`;
  // Per-source sections
  for (let i=0;i<sources.length;i++){
    const s = sources[i];
    const heading = `## ${i+1}. ${s.title || s.siteName || '추천 맛집'}`;
    const excerpt = s.text ? s.text.replace(/\s+/g,' ').trim().slice(0,1000) : (s.snippet || '상세 내용은 원문을 참고하세요.');
    const sourceLine = `[원문 보기](${s.url}) — 출처: ${s.siteName || s.url}`;
    md += heading + '\n\n';
    // simple paragraph split into sentences for markdown
    md += excerpt + '\n\n';
    md += sourceLine + '\n\n';
  }
  return md;
}

function generate(query, rawResults) {
  const sources = rawResults.map(r => ({
    title: r.title || '',
    url: r.url,
    snippet: r.snippet || '',
    siteName: r.siteName || '',
    text: r.text || ''
  }));
  const title = makeTitle(query, sources);
  const summary_5lines = makeSummary(sources);
  const article_markdown = toMarkdown(sources, query);
  const sourcesMeta = sources.map(s => ({title: s.title, url: s.url, siteName: s.siteName}));
  let slug = slugify(title);
  if (!slug) {
    // fallback: region-topic-timestamp
    const safeQuery = (query || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    slug = `${safeQuery}-${Math.floor(Date.now()/1000)}`.slice(0,80);
  }
  const category = (query.match(/(phu-?quoc|nha-?trang|da-?nang|ho-?chi-?minh|hanoi|ha-?long|dalat|hoi-?an|sapa|mui-?ne)/i) || [])[0] || '';
  return { title, summary_5lines, article_markdown, sources: sourcesMeta, slug, category };
}

module.exports = { generate };
