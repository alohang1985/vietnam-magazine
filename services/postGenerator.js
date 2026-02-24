const REGION_MAP = { '푸꾸옥':'phu-quoc','나트랑':'nha-trang','다낭':'da-nang', '호치민':'ho-chi-minh','하노이':'hanoi','하롱':'ha-long', '달랏':'dalat','호이안':'hoi-an','사파':'sapa','무이네':'mui-ne' };

const TOPIC_MAP = { '맛집': 'restaurant', '카페': 'cafe', '투어': 'tour', '호핑': 'hopping-tour', '숙소': 'accommodation', '호텔': 'hotel', '리조트': 'resort', '마트': 'mart', '쇼핑': 'shopping', '해변': 'beach', '스파': 'spa', '야시장': 'night-market', '관광': 'sightseeing' };

async function generate(query, sources, region, topic) {
  const regionEn = REGION_MAP[region] || 'other';
  const title = region + ' ' + topic + ' 완벽 가이드: 현지인이 추천하는 BEST 5';
  const topicEn = TOPIC_MAP[topic] || 'guide';
  const slug = regionEn + '-' + topicEn + '-' + Date.now();
  const category = regionEn;
  const snippets = (sources||[]).map((s,i)=>`[${i+1}] ${s.snippet||''}`).join(' ');
  const prompt = '당신은 베트남 여행 전문 20대 여성 블로거입니다. ' + '주제: ' + query + ' ' + '참고자료: ' + snippets + ' ' + '위 주제로 3000자 이상 여행 블로그 포스팅을 마크다운으로 작성하세요. ' + '이모지 포함, 귀엽고 전문적으로. ' + 'JSON이나 코드블록 없이 본문 텍스트만 출력하세요.';
  const apiKey = process.env.GEMINI_API_KEY;
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey;
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({contents:[{parts:[{text:prompt}]}]}) });
  const data = await res.json();
  console.log('Gemini full response:', JSON.stringify(data).slice(0,2000));
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if(!raw) console.error('Gemini response missing text field or empty');
  // Log raw preview for debugging (first 2KB)
  console.log('Gemini raw preview:', (raw||'').slice(0,2048));
  // Clean raw: remove any JSON fragment appended inside the raw text (e.g. ...markdown...{"title":...})
  let cleaned = raw || '';
  if (cleaned) {
    const jsonPos = cleaned.search(/\{\s*"title"\s*:/);
    if (jsonPos === -1) {
      const otherPos = cleaned.search(/\n\{\s*"/);
      if (otherPos !== -1) {
        cleaned = cleaned.slice(0, otherPos);
        console.log('Removed trailing JSON fragment starting at newline.');
      }
    } else {
      cleaned = cleaned.slice(0, jsonPos);
      console.log('Removed trailing JSON fragment starting at index:', jsonPos);
    }
  }

  // Try to extract inner content if model returned a pure JSON string instead
  let extracted = '';
  if (cleaned) {
    try {
      const parsed = JSON.parse(cleaned);
      extracted = parsed.content || parsed.article_markdown || parsed.text || '';
      console.log('Gemini parsed JSON keys found. Using extracted content length:', extracted ? String(extracted).length : 0);
    } catch (e) {
      // cleaned is likely plain markdown
      extracted = cleaned;
      console.log('Gemini cleaned is not JSON; using cleaned text length:', String(cleaned).length);
    }
  }

  // fallback: if very short, use snippets as minimal content
  let article_markdown = (extracted && String(extracted).trim()) ? String(extracted).trim() : '';
  if (!article_markdown || article_markdown.length < 200) {
    console.warn('Article markdown too short; using snippets fallback. length=', article_markdown.length);
    article_markdown = snippets || '내용이 충분하지 않아 간단 요약만 제공합니다.';
  }
  console.log('Final article_markdown length:', article_markdown.length);
  return { title, slug, category, article_markdown };
}

module.exports = { generate };