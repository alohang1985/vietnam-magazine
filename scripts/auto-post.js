const axios = require('axios');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const categories = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];
const categoryNamesKo = {
  'phu-quoc': '푸꾸옥',
  'nha-trang': '나트랑',
  'da-nang': '다낭',
  'ho-chi-minh': '호치민',
  'hanoi': '하노이',
  'ha-long': '하롱베이',
  'dalat': '달랏',
  'hoi-an': '호이안',
  'sapa': '사파',
  'mui-ne': '무이네',
};
const categoryNamesEn = {
  'phu-quoc': 'phu quoc vietnam',
  'nha-trang': 'nha trang vietnam',
  'da-nang': 'da nang vietnam',
  'ho-chi-minh': 'ho chi minh city vietnam',
  'hanoi': 'hanoi vietnam',
  'ha-long': 'halong bay vietnam',
  'dalat': 'dalat vietnam',
  'hoi-an': 'hoi an vietnam',
  'sapa': 'sapa vietnam',
  'mui-ne': 'mui ne vietnam',
};

const topics = [
  { keyword: '맛집 추천', type: 'food', searchQuery: '맛집 추천 현지인 로컬' },
  { keyword: '길거리 음식 추천', type: 'food', searchQuery: '길거리 음식 먹어봐야 할' },
  { keyword: '카페 추천', type: 'cafe', searchQuery: '카페 추천 분위기' },
  { keyword: '루프탑 바 추천', type: 'travel', searchQuery: '루프탑 바 야경' },
  { keyword: '해산물 맛집 추천', type: 'food', searchQuery: '해산물 맛집 가격' },
  { keyword: '쌀국수 맛집 추천', type: 'food', searchQuery: '쌀국수 맛집 현지인' },
  { keyword: '반미 맛집 추천', type: 'food', searchQuery: '반미 맛집 추천' },
  { keyword: '여행코스 3박4일', type: 'travel', searchQuery: '여행코스 3박4일 일정' },
  { keyword: '여행코스 4박5일', type: 'travel', searchQuery: '여행코스 4박5일 일정' },
  { keyword: '가볼만한곳 추천', type: 'travel', searchQuery: '가볼만한곳 관광지' },
  { keyword: '호텔 추천', type: 'hotel', searchQuery: '호텔 추천 가성비' },
  { keyword: '리조트 추천', type: 'hotel', searchQuery: '리조트 추천 풀빌라' },
  { keyword: '여행 경비 총정리', type: 'travel', searchQuery: '여행 경비 비용 물가' },
  { keyword: '야시장 추천', type: 'travel', searchQuery: '야시장 추천 먹거리' },
  { keyword: '마사지 스파 추천', type: 'travel', searchQuery: '마사지 스파 가성비' },
  { keyword: '쇼핑 추천', type: 'travel', searchQuery: '쇼핑 기념품 추천' },
  { keyword: '혼자 여행 가이드', type: 'travel', searchQuery: '혼자 여행 자유여행' },
  { keyword: '가족 여행 코스', type: 'travel', searchQuery: '가족 여행 아이와 함께' },
  { keyword: '커플 여행 코스', type: 'travel', searchQuery: '커플 여행 데이트' },
  { keyword: '교통 이용 가이드', type: 'travel', searchQuery: '택시 그랩 교통 이용법' },
  { keyword: '숙소 가성비 추천', type: 'hotel', searchQuery: '숙소 가성비 저렴한' },
  { keyword: '사원 유적지 추천', type: 'travel', searchQuery: '사원 유적지 역사' },
  { keyword: '일출 일몰 명소', type: 'travel', searchQuery: '일출 일몰 명소 포토' },
  { keyword: '우기 여행 팁', type: 'travel', searchQuery: '우기 여행 비 대비' },
  { keyword: '디저트 카페 추천', type: 'cafe', searchQuery: '디저트 카페 빙수' },
  { keyword: '다이빙 스노클링 추천', type: 'travel', searchQuery: '다이빙 스노클링 체험' },
  { keyword: '쿠킹클래스 체험', type: 'travel', searchQuery: '쿠킹클래스 요리 체험' },
  { keyword: '환전 팁 총정리', type: 'travel', searchQuery: '환전 현금 팁' },
  { keyword: '유심 와이파이 추천', type: 'travel', searchQuery: '유심 이심 와이파이' },
  { keyword: '여행 준비물 체크리스트', type: 'travel', searchQuery: '여행 준비물 필수' },
];

const unsplashTypeMap = { food: 'food restaurant', cafe: 'cafe coffee', hotel: 'hotel resort', travel: 'travel' };

async function getUnsplashImage(category, topicType) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const query = `${categoryNamesEn[category]} ${unsplashTypeMap[topicType] || 'travel'}`;
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 5, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    // Pick a random photo from top 5 to avoid always using the same image
    const photos = res.data.results || [];
    const photo = photos[Math.floor(Math.random() * photos.length)];
    if (!photo) return null;
    return { url: photo.urls.regular, credit: `Photo by ${photo.user.name} on Unsplash`, link: photo.links.html };
  } catch (e) {
    console.log('Unsplash error:', e.message);
    return null;
  }
}

async function searchReferences(category, topic) {
  // Search Brave for real, recent blog posts about this topic
  const braveKey = process.env.BRAVE_API_KEY;
  if (!braveKey) {
    console.warn('BRAVE_API_KEY not set; skipping search');
    return '';
  }

  const cityKo = categoryNamesKo[category];
  const searchTerm = `${cityKo} ${topic.searchQuery}`;

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchTerm)}&source=web&count=5&ui_lang=ko-KR&freshness=pm`;
    const res = await axios.get(url, {
      headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' }
    });
    const results = (res.data.web?.results || res.data.results || []).slice(0, 5);
    const snippets = results.map((r, i) => {
      return `${i + 1}. ${r.title || ''}\n   ${r.description || r.snippet || ''}`;
    }).join('\n\n');
    console.log(`Brave search: "${searchTerm}" → ${results.length} results`);
    console.log('Snippets preview:', snippets.substring(0, 500));
    return snippets;
  } catch (e) {
    console.warn('Brave search failed:', e.message);
    return '';
  }
}

async function generateContent(category, topic, snippets) {
  const cityKo = categoryNamesKo[category];
  const fullKeyword = `${cityKo} ${topic.keyword}`;

  const prompt = `당신은 베트남 현지에서 오래 거주한 경험 많은 여행 전문가입니다. 한국인 여행자를 위한 실용적인 여행 가이드를 작성하세요.

[글의 주제]
${fullKeyword}

[참고 자료 - 최신 검색 결과]
${snippets || '(참고 자료 없음 - 당신의 지식을 기반으로 작성하세요)'}

[작성 규칙]
1. 톤: 경험 많은 여행자가 친구에게 알려주는 느낌. 딱딱하지 않되 전문적. 이모지는 사용하지 않음.
2. 도입부: "안녕~" 같은 인사 없이, 바로 핵심으로 진입. 예: "${cityKo}에서 뭘 먹어야 할지 고민이라면, 이 글 하나로 해결됩니다."
3. 본문 구조:
   - 각 장소/항목마다: 이름(영어 병기) → 2-3문장 설명 → 추천 메뉴/포인트 → 실용 정보(주소, 가격, 영업시간)
   - 짧은 문단 (2-3줄씩)
   - 가격은 반드시 베트남 동 + 한화 환산 병기
4. 반드시 실제 존재하는 구체적인 장소/식당 이름을 사용. 플레이스홀더 절대 금지.
5. 참고 자료에 언급된 실제 장소명을 우선 활용. 없으면 실제 존재하는 유명한 곳을 사용.
6. 글 후반부에 "가기 전에 알아두면 좋은 것들" 섹션을 넣되, Q&A 형식이 아닌 경험담처럼 자연스럽게 작성. 예: "저도 처음에 카드만 들고 갔다가 당황했는데, 로컬 식당은 거의 현금만 받습니다."
7. 예산 가이드 표를 포함 (저/중/고 예산별 비용)
8. 분량: 3000자 이상
9. 형식: 순수 마크다운 본문만 출력. JSON이나 코드블록 없이 텍스트만 반환.
10. 제목은 출력하지 마세요. 본문만 작성하세요.

[SEO 키워드 - 글에 자연스럽게 포함]
메인: ${fullKeyword}
서브: ${cityKo} 여행, ${cityKo} 가볼만한곳, 베트남 여행`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!raw) {
    console.error('Gemini returned empty text for:', fullKeyword);
    console.error('Response preview:', JSON.stringify(response.data).substring(0, 500));
  }

  // Generate SEO-friendly title
  const titleTemplates = [
    `${fullKeyword} BEST 7 | 현지인이 진짜 가는 곳만 총정리 (2026)`,
    `${fullKeyword} | 실패 없는 현지 로컬 가이드 (2026)`,
    `${fullKeyword} TOP 5 | 관광객은 모르는 찐 로컬 리스트`,
    `${fullKeyword} | 현지 거주자가 직접 추천하는 리스트 (2026)`,
  ];
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  // Clean slug
  const slug = `${category}-${topic.keyword.replace(/\s+/g, '-')}-${Date.now()}`;

  return { title, slug, content: raw };
}

async function createPost(data, category, image) {
  try {
    const now = new Date().toISOString();
    const postData = {
      title: data.title,
      slug: data.slug,
      category: category,
      article_markdown: data.content,
      status: 'published',
      published_at: now,
      publishedAt: now,
    };
    if (image) {
      postData.article_markdown = `![${image.credit}](${image.url})\n*[${image.credit}](${image.link})*\n\n` + data.content;
    }
    const response = await axios.post(
      `${STRAPI_URL}/api/posts`,
      { data: postData },
      { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    console.error('Strapi error status:', err.response?.status);
    console.error('Strapi error data:', JSON.stringify(err.response?.data, null, 2));
    throw err;
  }
}

async function main() {
  const category = categories[Math.floor(Math.random() * categories.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const cityKo = categoryNamesKo[category];

  console.log(`Selected: ${cityKo} / ${topic.keyword}`);

  // Step 1: Search for real data
  const snippets = await searchReferences(category, topic);

  // Step 2: Generate content based on real data + get image
  const [content, image] = await Promise.all([
    generateContent(category, topic, snippets),
    getUnsplashImage(category, topic.type)
  ]);

  console.log('Generated title:', content.title);
  if (image) console.log('Image found:', image.url);

  // Step 3: Publish
  const post = await createPost(content, category, image);
  console.log('Post created:', post.data?.id);
}

main().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
