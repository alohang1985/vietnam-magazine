const axios = require('axios');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Brave API key from environment only
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || null;
if (!BRAVE_API_KEY) {
  console.warn('[WARN] BRAVE_API_KEY is not set. Brave Search disabled for telegram-bot.');
}

const ALLOWED_CATEGORIES = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];

// 필수 env 검증 (BRAVE is optional)
const requiredEnv = ['TELEGRAM_BOT_TOKEN','GEMINI_API_KEY','STRAPI_URL','STRAPI_API_TOKEN'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`Attempt ${i+1} failed: ${e.message}`);
      if (i < retries - 1) await sleep(2000 * (i + 1));
      else throw e;
    }
  }
}

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
    console.error('Unsplash error:', e.message);
    return null;
  }
}

function extractJson(raw) {
  console.log('Raw response:', (raw||'').slice(0, 300));
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e1) {}
  const match = cleaned.match(/\{(?:[^{}]|[\s\S])*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e2) {
      console.error('JSON parse error:', e2.message);
      console.error('Matched string:', match[0].slice(0, 300));
    }
  }
  const titleMatch = raw.match(/"title"\s*:\s*"([^"]+)"/);
  const slugMatch = raw.match(/"slug"\s*:\s*"([^"]+)"/);
  const categoryMatch = raw.match(/"category"\s*:\s*"([^"]+)"/);
  const contentMatch = raw.match(/"content"\s*:\s*"([\s\S]+?)"\s*[,}]/);
  if (titleMatch && slugMatch && contentMatch) {
    return {
      title: titleMatch[1],
      slug: slugMatch[1],
      category: categoryMatch ? categoryMatch[1] : 'ho-chi-minh',
      content: contentMatch[1].replace(/\ /g, ' ').replace(/\"/g, '"')
    };
  }
  throw new Error('Failed to parse JSON from Gemini response');
}


async function generateFromPage(url, pageText) {
  return retry(async () => {
    const prompt = `You must respond with ONLY a valid JSON object. Analyze the following web page and reconstruct it as a Korean travel magazine article. Do not include the raw HTML. Topic: "${url}"
Page content:
${pageText}
Rules: - Korean language only for title and content - English only for slug - Include real place info when present - Markdown format with ## headings - Minimum 500 characters - Friendly tone - Return ONLY JSON: {"title":"한국어 제목","slug":"english-slug","category":"city","content":"markdown"}`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192, temperature: 0.5 } }
    );
    const raw = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini(page) preview:', (raw||'').slice(0,200));
    return extractJson(raw||'');
  });
}
async function generatePost(topic) {
  return retry(async () => {
    const prompt = `You must respond with ONLY a valid JSON object. No markdown, no code blocks, no backticks. Just raw JSON. User provided content about a Vietnam travel topic: """ ${topic} """ Your job: 1. Analyze the content above 2. Rewrite it as a Korean travel magazine article 3. Keep all real information (prices, menus, locations, tips) from the original 4. Add a Google Maps link for the main place: [지도에서 보기](https://maps.google.com/?q=PLACE_NAME+CITY_NAME+Vietnam) 5. Use ## headings in markdown 6. Friendly Korean tone 7. End with 💡 여행 꿀팁 section Return ONLY this JSON (no backticks, no extra text): {"title":"한국어 제목","slug":"english-slug-only","category":"city","content":"markdown content here"} category must be one of: phu-quoc, nha-trang, da-nang, ho-chi-minh, hanoi, ha-long, dalat, hoi-an, sapa, mui-ne`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192, temperature: 0.5 } }
    );

    const raw = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini response preview:', (raw || '').slice(0, 200));
    return extractJson(raw || '');
  });
}

function validatePostData(data) {
  if (!data.title || data.title.length < 2) throw new Error('Invalid title');
  if (!data.slug) throw new Error('Invalid slug');
  if (!data.content || data.content.length < 500) throw new Error('Content too short');
  if (!ALLOWED_CATEGORIES.includes(data.category)) data.category = 'ho-chi-minh';
  return data;
}

async function createPost(data, image) {
  data = validatePostData(data);
  let content = data.content;
  if (image) content = `![${image.credit}](${image.url}) ` + content;
  const slug = (data.slug + '-' + Date.now()).replace(/[^A-Za-z0-9\-_.~]/g, '').toLowerCase();
  return retry(async () => {
    const response = await axios.post(
      `${STRAPI_URL}/api/posts`,
      { data: { title: data.title, slug, category: data.category, article_markdown: content, published_at: new Date().toISOString() } },
      { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log('Strapi response status:', response.status);
    return response.data;
  });
}

async function processMessage(chatId, text) {
  const trimmed = text.trim();
  try {
    await sendMessage(chatId, `⏳ "${trimmed}" 포스팅 생성 중입니다...`);
    if (/^https?:\/\//i.test(trimmed)) {
      // user sent a URL - fetch page and ask Gemini to analyze it
      let pageText;
      try {
        pageText = await fetchPageText(trimmed);
      } catch (err) {
        await sendMessage(chatId, `❌ URL을 가져오지 못했습니다: ${err.message}`);
        return;
      }
      const data = await generateFromPage(trimmed, pageText);
      // for URL-origin posts, do not attach Unsplash image; create post and return summary text to user
      const post = await createPost(data, null);
      await sendMessage(chatId, `✅ URL 분석 및 포스팅 완료! <b>${data.title}</b>
요약:
${data.content.slice(0,300)}...`);
    } else {
      const [data, image] = await Promise.all([generatePost(trimmed), getUnsplashImage(trimmed)]);
      const post = await createPost(data, image);
      const slug = post.data && post.data.attributes ? post.data.attributes.slug : '';
      await sendMessage(chatId, `✅ 포스팅 완료! <b>${data.title}</b> 🔗 https://vietnam-magazine.vercel.app/posts/${slug}`);
    }
  } catch (e) {
    console.error('processMessage error:', e.message);
    await sendMessage(chatId, `❌ 오류 발생: ${e.message}`);
  }
}

async function startPolling() {
  let offset = 0;
  console.log('Telegram bot started...');
  while (true) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`, { params: { offset, timeout: 30 } });
      for (const update of res.data.result) {
        offset = update.update_id + 1;
        if (update.message && update.message.text && !update.message.text.startsWith('/')) {
          processMessage(update.message.chat.id, update.message.text);
        }
      }
    } catch (e) {
      console.error('Polling error:', e.message);
      await sleep(5000);
    }
  }
}

startPolling();
