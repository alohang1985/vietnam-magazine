// Simple post generator: takes title hint + array of sources [{title,url,snippet,text}]
// Produces {title, summary_5lines, article_markdown, sources, slug, category}

const REGION_TOPIC_MAP = {
  '푸꾸옥': 'phu-quoc',
  '푸쿠옥': 'phu-quoc',
  '호치민': 'ho-chi-minh',
  '하노이': 'hanoi',
  '다낭': 'da-nang',
  '나트랑': 'nha-trang',
  '나짱': 'nha-trang',
  '달랏': 'da-lat',
  '하롱': 'ha-long',
  '맛집': 'restaurant',
  '카페': 'cafe',
  '여행': 'travel',
  '관광': 'tourism',
  '숙소': 'accommodation'
};

function mapTerm(kw) {
  if (!kw) return '';
  const key = kw.trim();
  return REGION_TOPIC_MAP[key] || key.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
}

function makeTitle(regionKorean, topicKorean) {
  const regionLabel = regionKorean || '';
  const topicLabel = topicKorean || '';
  return `${regionLabel} ${topicLabel} 완벽 가이드: 현지인이 추천하는 BEST 5`;
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

function slugify(text){
  const s = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  return s || '';
}

function toMarkdown(sources, query, summary_5lines) {
  // Intro using region/topic from query if present
  let md = `여행 매거진 스타일 가이드\n\n`;
  if (summary_5lines) md += `> ${summary_5lines}\n\n`;
  // Per-source sections
  for (let i=0;i<sources.length;i++){
    const s = sources[i];
    const heading = `## ${i+1}. ${s.title || s.siteName || '추천 맛집'}`;
    // prefer full text, fallback to snippet
    let excerpt = s.text ? s.text.replace(/\s+/g,' ').trim() : (s.snippet || '상세 내용은 원문을 참고하세요.');
    // ensure some length by repeating snippet if too short
    if (excerpt.length < 500 && s.snippet) {
      excerpt = (s.snippet + ' ' + s.snippet + ' ' + s.snippet).slice(0,900);
    }
    const sourceLine = `[원문 보기](${s.url}) — 출처: ${s.siteName || s.url}`;
    md += heading + '\n\n';
    md += excerpt + '\n\n';
    md += sourceLine + '\n\n';
  }
  // ensure total length >= 1500 by appending snippets if needed
  if (md.length < 1500) {
    const extra = sources.map(s => (s.snippet || '')).join('\n\n');
    md += '\n\n' + extra.repeat(5).slice(0, 1600 - md.length);
  }
  return md;
}

function generate(query, rawResults, region = '', topic = '') {
  const sources = rawResults.map(r => ({
    title: r.title || '',
    url: r.url,
    snippet: r.snippet || '',
    siteName: r.siteName || '',
    text: r.text || ''
  }));
  // ensure region/topic mapping
  const regionMapped = mapTerm(region);
  const topicMapped = mapTerm(topic);
  const title = makeTitle(region || query, topic || '');
  const summary_5lines = makeSummary(sources);
  const article_markdown = toMarkdown(sources, query, summary_5lines);
  const sourcesMeta = sources.map(s => ({title: s.title, url: s.url, siteName: s.siteName}));
  // slug: region-topic-timestamp
  const timestamp = Math.floor(Date.now()/1000);
  let slug = `${regionMapped}-${topicMapped}-${timestamp}`.replace(/-+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
  if (!slug || /^-+$/.test(slug)) {
    slug = slugify(title) || (`${query.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${timestamp}`.slice(0,80));
  }
  const category = regionMapped || (query.match(/(phu-?quoc|nha-?trang|da-?nang|ho-?chi-?minh|hanoi|ha-?long|da-?lat|dalat|hoi-?an|sapa|mui-?ne)/i) || [])[0] || '';
  return { title, summary_5lines, article_markdown, sources: sourcesMeta, slug, category };
}

module.exports = { generate };
