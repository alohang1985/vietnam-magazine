const axios = require('axios');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const categories = {
  '푸꾸옥': 'phu-quoc',
  '나트랑': 'nha-trang',
  '다낭': 'da-nang',
  '호치민': 'ho-chi-minh',
  '하노이': 'hanoi',
  '하롱': 'ha-long',
  '달랏': 'dalat',
  '호이안': 'hoi-an',
  '사파': 'sapa',
  '무이네': 'mui-ne'
};

async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: chatId, text, parse_mode: 'HTML' });
}

async function getUnsplashImage(query) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: query + ' vietnam', per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const photo = res.data.results[0];
    if (!photo) return null;
    return { url: photo.urls.regular, credit: `Photo by ${photo.user.name} on Unsplash`, link: photo.links.html };
  } catch (e) {
    return null;
  }
}

async function generatePost(topic) {
    const prompt = `You must respond with ONLY a valid JSON object. No markdown, no explanation, no code blocks. Just raw JSON. Topic: "${topic}" Write a Korean travel magazine article about this topic in Vietnam. Rules: - Korean language - Include real place info (price, location, hours) if applicable - Google maps link format: [지도에서 보기](https://maps.google.com/?q=${encodeURIComponent(topic)}) - Markdown format with ## headings - Minimum 800 characters - Friendly tone - End with 💡 여행 꿀팁 section Respond with this exact JSON structure (raw JSON only, no backticks): {"title":"제목","slug":"english-slug-here","category":"most-relevant-city","content":"markdown content here"} category must be one of: phu-quoc, nha-trang, da-nang, ho-chi-minh, hanoi, ha-long, dalat, hoi-an, sapa, mui-ne`;


  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 3000, temperature: 0.7 } }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Gemini raw response:', (text || '').slice(0, 500));
  const cleaned = (text || '').replace(/`{3}json/g, '').replace(/`{3}/g, '').replace(/^\s*json\s*/i, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Full response:', text);
    throw new Error('JSON not found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

async function createPost(data, image) {
  let content = data.content;
  if (image) content = `![${image.credit}](${image.url}) *[${image.credit}](${image.link})* ` + content;
  const slug = (data.slug + '-' + Date.now()).replace(/[^A-Za-z0-9\-_.~]/g, '').toLowerCase();
  const response = await axios.post(
    `${STRAPI_URL}/api/posts`,
    { data: { title: data.title, slug, category: data.category, article_markdown: content, published_at: new Date().toISOString() } },
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

async function processMessage(chatId, text) {
  const trimmed = text.trim();
  if (trimmed === '포스팅') {
    await sendMessage(chatId, '⏳ 포스팅 자동 생성 중입니다...');
    const cats = Object.values(categories);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const topics = ['숨겨진 맛집 3곳', '포토스팟 TOP 3', '길거리 음식 완전 정복', '가성비 숙소 TOP 3'];
    const topic = cat + ' ' + topics[Math.floor(Math.random() * topics.length)];
    const [data, image] = await Promise.all([generatePost(topic), getUnsplashImage(topic)]);
    const post = await createPost(data, image);
    await sendMessage(chatId, `✅ 포스팅 완료! <b>${data.title}</b> 🔗 https://vietnam-magazine.vercel.app/posts/${post.data?.attributes?.slug || ''}`);
  } else {
    await sendMessage(chatId, `⏳ "${trimmed}" 포스팅 생성 중입니다...`);
    const [data, image] = await Promise.all([generatePost(trimmed), getUnsplashImage(trimmed)]);
    const post = await createPost(data, image);
    await sendMessage(chatId, `✅ 포스팅 완료! <b>${data.title}</b> 🔗 https://vietnam-magazine.vercel.app/posts/${post.data?.attributes?.slug || ''}`);
  }
}

async function startPolling() {
  let offset = 0;
  console.log('Telegram bot started...');
  while (true) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`, { params: { offset, timeout: 30 } });
      const updates = res.data.result;
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message?.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;
          if (text.startsWith('/')) continue;
          processMessage(chatId, text).catch(e => sendMessage(chatId, '❌ 오류 발생: ' + e.message));
        }
      }
    } catch (e) {
      console.error('Polling error:', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

startPolling();
