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
  '숙소': 'accommodation',
  '투어': 'tour',
  '호핑': 'hopping-tour',
  '액티비티': 'activity',
  '스파': 'spa',
  '마사지': 'massage',
  '호텔': 'hotel',
  '리조트': 'resort',
  '야시장': 'night-market',
  '시장': 'market',
  '해변': 'beach',
  '비치': 'beach',
  '섬': 'island',
  '관광지': 'attraction',
  '명소': 'attraction',
  '루프탑': 'rooftop',
  '바': 'bar',
  '펍': 'pub',
  '클럽': 'club',
  '쇼핑': 'shopping',
  '마트': 'supermarket'
};

// Region -> Strapi category mapping (only regions)
const REGION_MAP = {
  '푸꾸옥': 'phu-quoc',
  '푸쿠옥': 'phu-quoc',
  '나트랑': 'nha-trang',
  '나짱': 'nha-trang',
  '다낭': 'da-nang',
  '호치민': 'ho-chi-minh',
  '하노이': 'hanoi',
  '하롱': 'ha-long',
  '달랏': 'dalat',
  '호이안': 'hoi-an',
  '사파': 'sapa',
  '무이네': 'mui-ne'
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

const axios = require('axios');

async function generate(query, rawResults, region = '', topic = '') {
  const sources = rawResults.map(r => ({
    title: r.title || '',
    url: r.url,
    snippet: r.snippet || '',
    siteName: r.siteName || '',
    text: r.text || ''
  }));

  const regionMapped = mapTerm(region);
  const topicMapped = mapTerm(topic);
  const timestamp = Math.floor(Date.now()/1000);
  const defaultSlug = `${regionMapped}-${topicMapped}-${timestamp}`.replace(/-+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);

  // Build prompt for Gemini using snippets + extracted text
  const snippets = sources.map((s,i)=>`[${i+1}] TITLE: ${s.title}\nSNIPPET: ${s.snippet}\nURL: ${s.url}`).join('\n\n');
  const fullTexts = sources.map((s,i)=>`[${i+1}] URL: ${s.url}\nTEXT: ${s.text ? s.text.slice(0,5000) : ''}`).join('\n\n');

  const geminiKey = process.env.GEMINI_API_KEY;

  // Request only the Markdown content from Gemini to avoid parsing issues
  let generatedContent = null;
  if (geminiKey) {
    const prompt = `다음 정보를 바탕으로 베트남 여행 매거진 스타일의 마크다운 본문만 작성해줘. 스타일 가이드는 기존과 동일하게 유지하되, 응답은 순수 마크다운 본문(3000자 이상)만 출력해줘. JSON이나 구분자 없이 텍스트만 반환.` + "\n\n" + `DATA:\n${snippets}\n\n${fullTexts}`;
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192, temperature: 0.6 } }
      );
      const raw = res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content && res.data.candidates[0].content.parts[0].text;
      if (raw) {
        generatedContent = raw.trim();
      }
    } catch (e) {
      console.error('Gemini call error:', e.message);
    }
  }

  // Build title/slug/category locally to avoid parsing issues
  const title = makeTitle(region || query, topic || '');
  const regionEn = regionMapped || 'ho-chi-minh';
  const topicEn = topicMapped || 'travel';
  const slug = `${regionEn}-${topicEn}-${Date.now()}`;
  const category = regionEn;

  const summary_5lines = makeSummary(sources);
  const article_markdown = generatedContent || toMarkdown(sources, query, summary_5lines);
  const sourcesMeta = sources.map(s => ({title: s.title, url: s.url, siteName: s.siteName}));

  return { title, summary_5lines, article_markdown, sources: sourcesMeta, slug, category };
}

module.exports = { generate };