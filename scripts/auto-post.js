const axios = require('axios');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const categories = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];

async function generateContent(category) {
  const prompt = `당신은 베트남 현지를 잘 아는 여행 전문 에디터입니다. 아래 카테고리에 대한 베트남 여행 매거진 기사를 한국어로 작성해주세요. 카테고리: ${category} 반드시 포함해야 할 내용: 1. 현지인처럼 즐기는 추천 루트 (오전/오후/저녁 일정) 2. 꼭 가봐야 할 식당 3곳 이상 (식당명, 추천 메뉴, 가격대, 위치) 3. 숨겨진 명소 또는 현지인만 아는 스팟 4. 실용적인 여행 팁 (교통, 최적 방문 시간, 주의사항) 5. 예상 예산 글 형식: - 마크다운 사용 - 소제목(##)으로 섹션 구분 - 최소 1500자 이상 - 독자에게 직접 말하는 친근한 어투 - 구체적인 장소명, 가격, 시간 포함 아래 JSON만 반환해줘 (다른 텍스트 없이): {"title":"제목","slug":"slug-here","content":"마크다운 본문"}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  const text = response.data.candidates[0].content.parts[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function createPost(data, category) {
  try {
    const response = await axios.post(
      `${STRAPI_URL}/api/posts`,
      { data: { title: data.title, slug: data.slug, category: category, article_markdown: data.content, published_at: new Date().toISOString() } },
      { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    console.error('Strapi error status:', err.response?.status);
    console.error('Strapi error data:', JSON.stringify(err.response?.data, null, 2));
    console.error('Strapi URL used:', `${STRAPI_URL}/api/posts`);
    throw err;
  }
}

async function main() {
  const category = categories[Math.floor(Math.random() * categories.length)];
  console.log('Selected category:', category);
  const content = await generateContent(category);
  console.log('Generated title:', content.title);
  const post = await createPost(content, category);
  console.log('Post created:', post.data?.id);
}

main().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
