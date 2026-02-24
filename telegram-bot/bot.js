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
    const prompt = `You must respond with ONLY a valid JSON object. Analyze the following web page and reconstruct it as a Korean travel magazine article following the STYLE GUIDELINES below. Do not include the raw HTML. Topic: "${url}"
Page content:
${pageText}

[STYLE GUIDELINES]
- 작성자: 베트남을 사랑하는 20대 여성 여행 블로거
- 톤: 전문적이면서도 귀엽고 여성스러운 문체
- 이모지 적절히 사용 (과하지 않게)
- 현지를 직접 다녀온 것처럼 생생하게
- 독자에게 말 걸듯이 친근하게
- 실용적인 정보(가격, 위치, 추천 메뉴) 포함

[구성 - 최소 3000자]
- 도입부: 설레는 여행 시작 느낌으로
- 맛집 소개 (3~5곳): 각 맛집마다 분위기, 추천메뉴, 가격대, 팁
- 여행 꿀팁 섹션
- 마무리: 독자를 응원하는 따뜻한 마무리

Rules: - Korean language only for title and content - English only for slug - Include real place info when present - Markdown format with ## headings - Minimum 3000 characters - Friendly tone - Return ONLY JSON: {"title":"한국어 제목","slug":"english-slug","category":"city","content":"markdown"}`;
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
    const prompt = `You must respond with ONLY a valid JSON object. No markdown, no code blocks, no backticks. Just raw JSON. User provided content about a Vietnam travel topic: """ ${topic} """ Your job: Rewrite the content as a Korean travel magazine article following the STYLE GUIDELINES below. Keep all real information (prices, menus, locations, tips) from the original when present. Add a Google Maps link for the main place. Use ## headings in markdown. Tone: friendly Korean. End with 💡 여행 꿀팁 section. Category must be one of: phu-quoc, nha-trang, da-nang, ho-chi-minh, hanoi, ha-long, dalat, hoi-an, sapa, mui-ne.

[STYLE GUIDELINES]
- 작성자: 베트남을 사랑하는 20대 여성 여행 블로거
- 톤: 전문적이면서도 귀엽고 여성스러운 문체
- 이모지 적절히 사용 (과하지 않게)
- 현지를 직접 다녀온 것처럼 생생하게
- 독자에게 말 걸듯이 친근하게
- 실용적인 정보(가격, 위치, 추천 메뉴) 포함

[구성 - 최소 3000자]
- 도입부: 설레는 여행 시작 느낌으로
- 맛집 소개 (3~5곳): 각 맛집마다 분위기, 추천메뉴, 가격대, 팁
- 여행 꿀팁 섹션
- 마무리: 독자를 응원하는 따뜻한 마무리

Return ONLY this JSON (no backticks, no extra text): {"title":"한국어 제목","slug":"english-slug-only","category":"city","content":"markdown content here"}`;

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


const { search } = require('../services/braveSearch');
const { fetchText } = require('../services/pageFetcher');
const { generate } = require('../services/postGenerator');
const { createPost } = require('../services/strapiClient');

async function processMessage(chatId, text) {
  const trimmed = text.trim();
  try {
    await sendMessage(chatId, `⏳ "${trimmed}" 포스팅 생성 중입니다...`);

    // Trigger phrase: generic region + topic + (post request verbs)
    // Capture region (group 1) and topic (맛집|카페|여행|관광|숙소) as group 2
    const triggerMatch = trimmed.match(/(.+?)\s*(맛집|카페|여행|관광|숙소|투어|호핑|액티비티|스파|마사지|호텔|리조트|야시장|시장|해변|비치|섬|관광지|명소|루프탑|바|펍|클럽|쇼핑|마트).*(포스팅\s*해줘|포스팅해줘|작성해줘|작성\s*해줘|포스트\s*작성)/i);
    if (triggerMatch) {
      const region = (triggerMatch[1] || '').trim();
      const topic = (triggerMatch[2] || '').trim();
      console.log('트리거 감지됨! 입력:', trimmed, '지역:', region, '주제:', topic);

      // Build Brave query from region + topic (e.g., "푸꾸옥 맛집")
      const query = `${region} ${topic}`.trim();

      // 1) Brave 실시간 검색 상위 3개
      await sendMessage(chatId, `🔎 "${query}"로 Brave에서 상위 3개 결과를 가져옵니다...`);
      const results = await search(query, 3, 'ko-KR');

      // 2) 각 페이지 텍스트 본문 가져오기 (동시)
      await sendMessage(chatId, '📄 각 결과의 본문을 수집 중입니다 (이미지 제외)...');
      const withText = await Promise.all(results.map(async r => {
        try {
          const text = await fetchText(r.url);
          return Object.assign({}, r, { text });
        } catch (e) {
          console.error('fetchText error for', r.url, e.message);
          return Object.assign({}, r, { text: r.snippet || '' });
        }
      }));

      // 3) 한국어 매거진 스타일 포스팅 생성
      await sendMessage(chatId, '✍️ 포스팅 초안을 생성합니다...');
      const postData = await generate(query, withText, region, topic);

      // 4) Strapi에 저장 (title, content, summary_5lines, sources)
      await sendMessage(chatId, '💾 Strapi에 저장합니다...');
      const created = await createPost({
        title: postData.title,
        article_markdown: postData.article_markdown,
        summary_5lines: postData.summary_5lines,
        sources: postData.sources,
        category: postData.category || 'ho-chi-minh',
        slug: postData.slug || undefined
      });

      // 5) 알림 (Strapi 응답에서 slug/ID 추출)
      let slug = null;
      if (created && created.data && created.data.attributes && created.data.attributes.slug) slug = created.data.attributes.slug;
      const frontend = process.env.FRONTEND_URL || process.env.SITE_BASE_URL || process.env.STRAPI_URL;
      const link = slug ? `${frontend.replace(/\/$/,'')}/posts/${slug}` : (created && created.data && created.data.id ? `${process.env.STRAPI_URL.replace(/\/$/,'')}/admin/content-manager/collectionType/api::post.post/${created.data.id}` : process.env.STRAPI_URL);
      await sendMessage(chatId, `✅ 포스팅 완료! 링크: ${link}`);
      return;
    }

    // Fallback: previous behavior (generate from plain topic via Gemini)
    if (/^https?:\/\//i.test(trimmed)) {
      let pageText;
      try {
        pageText = await fetchPageText(trimmed);
      } catch (err) {
        await sendMessage(chatId, `❌ URL을 가져오지 못했습니다: ${err.message}`);
        return;
      }
      const data = await generateFromPage(trimmed, pageText);
      const post = await createPost(data, null);
      await sendMessage(chatId, `✅ URL 분석 및 포스팅 완료! <b>${data.title}</b>\n요약:\n${data.content.slice(0,300)}...`);
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
