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
  const content = makeContent(sources);
  const sourcesMeta = sources.map(s => ({title: s.title, url: s.url, siteName: s.siteName}));
  return { title, summary_5lines, content, sources: sourcesMeta };
}

module.exports = { generate };
