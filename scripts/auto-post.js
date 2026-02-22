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
  '꼭 방문해야 할 숨겨진 맛집 3곳 (가격, 위치, 추천 메뉴 포함)',
  '현지인만 아는 비밀 스팟 3곳 (구글맵 링크 포함)',
  '최고의 카페 3곳 (분위기, 가격, 위치 포함)',
  '꼭 해봐야 할 액티비티 3가지 (예약 방법, 가격 포함)',
  '가성비 최고 숙소 3곳 (가격대, 특징, 예약 링크 포함)',
  '현지 시장 완전 정복 가이드 (위치, 추천 쇼핑 아이템, 흥정 팁)',
  '뚜벅이 여행자를 위한 완벽 루트 (대중교통 이용법 포함)',
  '일몰/일출 명소 3곳 (최적 방문 시간, 위치 포함)',
  '길거리 음식 완전 정복 (메뉴명, 가격, 위치 포함)',
  '포토스팟 3곳 (촬영 팁, 최적 시간대 포함)',
  '당일치기 근교 여행 코스 (교통편, 비용 포함)',
  '로컬 투어 추천 3가지 (예약 사이트, 가격 비교 포함)',
  '우기/건기별 여행 완벽 가이드',
  '혼자 여행하기 좋은 이유 5가지 (안전 팁 포함)',
  '커플 여행 완벽 코스 (로맨틱 레스토랑, 야경 스팟 포함)',
];

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
  const prompt = `당신은 베트남 현지를 직접 발로 뛰며 취재하는 여행 전문 에디터입니다. 카테고리(여행지): ${category} 이번 포스팅 주제: ${topic} 작성 규칙: - 한국어로 작성 - 실제 존재하는 장소/식당/숙소 이름 사용 (베트남어 원어명 병기) - 각 장소마다 구글맵 링크 형식으로 포함: [지도에서 보기](https://maps.google.com/?q=장소명+${category}) - 실제 가격 정보 포함 (VND 및 원화 환산) - 예약/방문 방법 구체적으로 안내 - 마크다운 형식, ## 소제목 사용 - 최소 1500자 이상 - 독자에게 직접 말하는 친근한 어투 - 글 마지막에 "💡 여행 꿀팁" 섹션 추가 아래 JSON만 반환 (다른 텍스트 없이): {"title":"제목","slug":"slug-here","content":"마크다운 본문"}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  const text = response.data.candidates[0].content.parts[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function createPost(data, category, image) {
  try {
    const postData = {
      title: data.title,
      slug: data.slug + '-' + Date.now(),
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
