const axios = require('axios');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const categories = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];
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
  '숨겨진 맛집 3곳 - 현지인만 아는 로컬 식당',
  '길거리 음식 완전 정복 - 꼭 먹어봐야 할 5가지',
  '카페 투어 - 분위기 최고인 카페 3곳',
  '루프탑 바 & 야경 명소 3곳',
  '새벽 시장 탐방 가이드',
  '채식주의자를 위한 맛집 3곳',
  '해산물 맛집 3곳 - 가격 비교 포함',
  '디저트 카페 & 빙수 맛집 3곳',
  '현지 쌀국수 맛집 완전 정복',
  '커피 문화 완전 정복 - 에그커피부터 코코넛커피까지',
  '포토스팟 3곳 - 인스타 성지',
  '일몰 명소 TOP 3',
  '새벽 안개 속 풍경 명소',
  '골목길 탐험 - 숨겨진 벽화거리',
  '현지인 동네 산책 코스',
  '사원 & 역사 유적지 완전 정복',
  '박물관 추천 - 놓치면 후회하는 곳',
  '야시장 완전 정복 가이드',
  '쇼핑 완전 정복 - 기념품 추천',
  '마사지 & 스파 가성비 TOP 3',
  '새벽 4시 출발 일출 투어',
  '반나절 근교 투어 코스',
  '자전거로 둘러보는 코스',
  '오토바이 렌트 완전 정복',
  '뚜벅이 여행자 교통 완전 정복',
  '1만원으로 하루 살기 도전',
  '럭셔리 하루 코스 - 고급 레스토랑부터 스파까지',
  '가성비 숙소 TOP 3 (1박 3만원 이하)',
  '뷰 최고인 숙소 TOP 3',
  '게스트하우스 vs 호텔 비교',
  '우기 여행 완전 정복 팁',
  '혼자 여행하기 완벽 가이드',
  '커플 여행 로맨틱 코스',
  '아이와 함께하는 가족 여행 코스',
  '시니어 여행자를 위한 편안한 코스',
  '20만원으로 2박 3일 완전 정복',
  '현지 쿠킹클래스 체험 후기',
  '다이빙 & 스노클링 완전 정복',
  '서핑 입문 가이드',
  '트레킹 코스 완전 정복',
  '카약 & 보트 투어 추천',
  '낚시 체험 가이드',
  '현지 축제 & 이벤트 완전 정복',
  '한국인 여행자 주의사항 TOP 5',
  '택시 & 그랩 이용 완전 정복',
  '환전 & 현금 완전 정복',
  '현지 유심 & 와이파이 완전 정복',
  '비상시 연락처 & 병원 가이드',
  '현지어 기본 회화 10선',
]


async function getUnsplashImage(category, topic) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const query = `${categoryNamesEn[category]} ${topic.includes('맛집') || topic.includes('음식') ? 'food' : topic.includes('카페') ? 'cafe' : topic.includes('숙소') ? 'hotel' : 'travel'}`;
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const photo = res.data.results[0];
    if (!photo) return null;
    return { url: photo.urls.regular, credit: `Photo by ${photo.user.name} on Unsplash`, link: photo.links.html };
  } catch (e) {
    console.log('Unsplash error:', e.message);
    return null;
  }
}

async function generateContent(category, topic) {
  // 1) Brave search top 3 (freshness=py)
  const braveKey = process.env.BRAVE_API_KEY;
  let snippets = '';
  try {
    if (braveKey) {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic)}&source=web&count=3&ui_lang=ko-KR&freshness=py`;
      const res = await axios.get(url, { headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' } });
      const results = res.data.results || [];
      snippets = results.map((r, i) => `[${i+1}] ${r.description || r.snippet || r.title || ''}`).join('\n');
      console.log('Brave snippets collected:', snippets.slice(0,500));
    } else {
      console.warn('BRAVE_API_KEY not set; skipping Brave search');
    }
  } catch (e) {
    console.warn('Brave search failed:', e.message);
  }

  // 2) Build Gemini prompt with snippets
  const prompt = `당신은 베트남 여행 전문 20대 여성 블로거입니다. 반드시 '${topic}'에 대한 포스팅만 작성하세요. 절대 다른 주제로 벗어나지 마세요. [참고 자료] ${snippets} [작성 조건] - 주제: ${topic} - 스타일: 20대 여성 여행 블로거, 귀엽고 전문적, 이모지 포함 - 분량: 3000자 이상 - 형식: 순수 마크다운 본문만 출력 - JSON이나 코드블록 없이 텍스트만 반환`;

  // 3) Call Gemini (use gemini-2.5-flash-lite)
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!raw) console.error('Gemini returned empty text for topic:', topic, 'response preview:', JSON.stringify(response.data).substring(0,500));

  // 4) Title and slug generation
  const title = `${topic} 완벽 가이드: 현지인이 추천하는 BEST 5`;
  const slugBase = topic.replace(/[^A-Za-z0-9\-_.~]/g, '-').toLowerCase();
  const slug = `${slugBase}-${Date.now()}`;

  // 5) Return object compatible with createPost (title, slug, content)
  return { title, slug, content: raw };
}

async function createPost(data, category, image) {
  try {
    const postData = {
      title: data.title,
      slug: (data.slug + '-' + Date.now()).replace(/[^A-Za-z0-9\-_.~]/g, '').toLowerCase(),
      category: category,
      article_markdown: data.content,
      published_at: new Date().toISOString()
    };
    if (image) {
      postData.article_markdown = `![${image.credit}](${image.url}) *[${image.credit}](${image.link})* ` + data.content;
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
  console.log('Selected category:', category);
  console.log('Selected topic:', topic);
  const [content, image] = await Promise.all([
    generateContent(category, topic),
    getUnsplashImage(category, topic)
  ]);
  console.log('Generated title:', content.title);
  if (image) console.log('Image found:', image.url);
  const post = await createPost(content, category, image);
  console.log('Post created:', post.data?.id);
}

main().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
