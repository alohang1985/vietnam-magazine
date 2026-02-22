const axios = require('axios');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const categories = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];

async function generateContent(category) {
  const prompt = `베트남 여행 잡지 기사를 한국어로 작성해줘. 카테고리: ${category}. 제목, 슬러그(영어 소문자 하이픈), 본문(마크다운, 최소 800자) 형식으로 아래 JSON만 반환해줘 (다른 텍스트 없이): {"title":"제목","slug":"slug-here","content":"마크다운 본문"}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  const text = response.data.candidates[0].content.parts[0].text;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function createPost(data, category) {
  const response = await axios.post(
    `${STRAPI_URL}/api/posts`,
    { data: { title: data.title, slug: data.slug, category: category, article_markdown: data.content, published_at: new Date().toISOString() } },
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
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
