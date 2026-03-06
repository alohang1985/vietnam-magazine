const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// ─── 도시 & 토픽 설정 ────────────────────────────────────
const categories = ['phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne'];
const categoryNamesKo = {
  'phu-quoc': '푸꾸옥', 'nha-trang': '나트랑', 'da-nang': '다낭',
  'ho-chi-minh': '호치민', 'hanoi': '하노이', 'ha-long': '하롱베이',
  'dalat': '달랏', 'hoi-an': '호이안', 'sapa': '사파', 'mui-ne': '무이네',
};
const categoryNamesEn = {
  'phu-quoc': 'phu quoc vietnam', 'nha-trang': 'nha trang vietnam',
  'da-nang': 'da nang vietnam', 'ho-chi-minh': 'ho chi minh city vietnam',
  'hanoi': 'hanoi vietnam', 'ha-long': 'halong bay vietnam',
  'dalat': 'dalat vietnam', 'hoi-an': 'hoi an vietnam',
  'sapa': 'sapa vietnam', 'mui-ne': 'mui ne vietnam',
};

const topics = [
  { keyword: '맛집 추천', slug: 'restaurant', type: 'food', searchQuery: '맛집 추천 현지인 로컬 2025 2026' },
  { keyword: '길거리 음식', slug: 'street-food', type: 'food', searchQuery: '길거리 음식 꼭 먹어봐야 할 추천' },
  { keyword: '카페 추천', slug: 'cafe', type: 'cafe', searchQuery: '카페 추천 분위기 좋은 인스타' },
  { keyword: '루프탑 바', slug: 'rooftop-bar', type: 'travel', searchQuery: '루프탑 바 야경 추천' },
  { keyword: '해산물 맛집', slug: 'seafood', type: 'food', searchQuery: '해산물 맛집 가격 싼 곳' },
  { keyword: '쌀국수 맛집', slug: 'pho', type: 'food', searchQuery: '쌀국수 맛집 현지인 추천' },
  { keyword: '반미 맛집', slug: 'banh-mi', type: 'food', searchQuery: '반미 맛집 추천 현지' },
  { keyword: '여행코스 3박4일', slug: 'itinerary-3d4n', type: 'travel', searchQuery: '여행코스 3박4일 일정 추천' },
  { keyword: '여행코스 4박5일', slug: 'itinerary-4d5n', type: 'travel', searchQuery: '여행코스 4박5일 일정 추천' },
  { keyword: '가볼만한곳', slug: 'attractions', type: 'travel', searchQuery: '가볼만한곳 관광지 추천' },
  { keyword: '호텔 추천', slug: 'hotel', type: 'hotel', searchQuery: '호텔 추천 가성비 2025 2026' },
  { keyword: '리조트 추천', slug: 'resort', type: 'hotel', searchQuery: '리조트 추천 풀빌라 럭셔리' },
  { keyword: '여행 경비', slug: 'budget', type: 'travel', searchQuery: '여행 경비 비용 물가 총정리' },
  { keyword: '야시장 추천', slug: 'night-market', type: 'travel', searchQuery: '야시장 추천 먹거리 쇼핑' },
  { keyword: '마사지 스파', slug: 'massage-spa', type: 'travel', searchQuery: '마사지 스파 가성비 추천' },
  { keyword: '쇼핑 추천', slug: 'shopping', type: 'travel', searchQuery: '쇼핑 기념품 시장 추천' },
  { keyword: '혼자 여행', slug: 'solo-travel', type: 'travel', searchQuery: '혼자 여행 자유여행 가이드' },
  { keyword: '가족 여행', slug: 'family-travel', type: 'travel', searchQuery: '가족 여행 아이와 함께 코스' },
  { keyword: '커플 여행', slug: 'couple-travel', type: 'travel', searchQuery: '커플 여행 데이트 코스' },
  { keyword: '교통 가이드', slug: 'transport', type: 'travel', searchQuery: '택시 그랩 교통 이용법 팁' },
  { keyword: '가성비 숙소', slug: 'budget-stay', type: 'hotel', searchQuery: '숙소 가성비 저렴한 게스트하우스' },
  { keyword: '일출 일몰 명소', slug: 'sunrise-sunset', type: 'travel', searchQuery: '일출 일몰 명소 포토스팟' },
  { keyword: '우기 여행 팁', slug: 'rainy-season', type: 'travel', searchQuery: '우기 여행 비 대비 시기' },
  { keyword: '다이빙 스노클링', slug: 'diving-snorkeling', type: 'travel', searchQuery: '다이빙 스노클링 체험 추천' },
  { keyword: '쿠킹클래스', slug: 'cooking-class', type: 'travel', searchQuery: '쿠킹클래스 요리 체험 추천' },
  { keyword: '환전 팁', slug: 'currency-exchange', type: 'travel', searchQuery: '환전 현금 팁 어디서' },
  { keyword: '유심 와이파이', slug: 'sim-wifi', type: 'travel', searchQuery: '유심 이심 와이파이 추천 가격' },
  { keyword: '여행 준비물', slug: 'packing-list', type: 'travel', searchQuery: '여행 준비물 필수 체크리스트' },
  { keyword: '비치 해변 추천', slug: 'beach', type: 'travel', searchQuery: '비치 해변 추천 예쁜 바다' },
  { keyword: '로컬 시장 투어', slug: 'local-market', type: 'travel', searchQuery: '재래시장 로컬 시장 투어' },
];

const unsplashTypeMap = { food: 'food restaurant', cafe: 'cafe coffee', hotel: 'hotel resort', travel: 'travel landscape' };

// ─── 기존 포스트 가져오기 (중복 방지) ──────────────────────
async function getExistingPosts() {
  try {
    const res = await axios.get(
      `${STRAPI_URL}/api/posts?fields[0]=title&fields[1]=category&fields[2]=slug&fields[3]=article_markdown&pagination[pageSize]=200`,
      { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
    );
    return (res.data.data || []).map(p => {
      const md = p.attributes.article_markdown || '';
      const imgMatch = md.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
      return {
        title: p.attributes.title,
        category: p.attributes.category,
        slug: p.attributes.slug,
        imageUrl: imgMatch ? imgMatch[1] : null,
      };
    });
  } catch (e) {
    console.warn('Failed to fetch existing posts:', e.message);
    return [];
  }
}

// ─── 중복되지 않는 토픽 선택 ─────────────────────────────
function selectTopic(existingPosts) {
  const existingKeys = new Set(
    existingPosts.map(p => `${p.category}-${p.title?.split('|')[0]?.trim()?.toLowerCase()}`)
  );

  // 시도 최대 50번
  for (let i = 0; i < 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const cityKo = categoryNamesKo[category];
    const testKey = `${category}-${cityKo} ${topic.keyword}`.toLowerCase();

    // 비슷한 기존 포스트가 있는지 체크
    const isDuplicate = existingPosts.some(p => {
      const pTitle = (p.title || '').toLowerCase();
      return p.category === category &&
        pTitle.includes(topic.keyword.split(' ')[0]);
    });

    if (!isDuplicate) {
      return { category, topic };
    }
    console.log(`Skipping duplicate: ${cityKo} ${topic.keyword}`);
  }

  // 50번 시도 후에도 못 찾으면 그냥 랜덤
  console.log('No unique topic found after 50 tries, using random');
  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    topic: topics[Math.floor(Math.random() * topics.length)],
  };
}

// ─── Unsplash 이미지 ─────────────────────────────────────
async function getUnsplashImage(category, topicType, usedImageUrls) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const query = `${categoryNamesEn[category]} ${unsplashTypeMap[topicType] || 'travel'}`;
    // 30장 가져와서 이미 사용된 것 제외
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 30, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const photos = res.data.results || [];
    const available = photos.filter(p => !usedImageUrls.has(p.urls.regular));
    const photo = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : photos[Math.floor(Math.random() * photos.length)]; // fallback
    if (!photo) return null;
    return { url: photo.urls.regular, credit: `Photo by ${photo.user.name} on Unsplash`, link: photo.links.html };
  } catch (e) {
    console.log('Unsplash error:', e.message);
    return null;
  }
}

// ─── Step 1: Gemini로 실시간 데이터 리서치 (Google Search grounding) ──
async function researchTopic(cityKo, topic) {
  const searchPrompt = `당신은 베트남 여행 리서처입니다. "${cityKo} ${topic.searchQuery}" 에 대해 Google에서 최신 정보를 검색하고, 아래 형식으로 정리해주세요.

검색 결과에서 다음 데이터를 추출하세요:
1. 실제 장소/식당/카페 이름 (최소 5개, 영어명 병기)
2. 각 장소의 가격 정보 (베트남 동 기준)
3. 각 장소의 주소 또는 위치
4. 각 장소의 영업시간
5. 각 장소에 대한 실제 리뷰나 평가 포인트
6. 추천 메뉴나 추천 포인트
7. 주의사항이나 팁

반드시 2024-2026년 최신 정보를 기준으로 작성하세요.
가격은 정확한 숫자로 작성하세요 (예: 50,000동).
존재하지 않는 장소를 만들어내지 마세요.

JSON이나 코드블록 없이, 자연스러운 텍스트로 정리해주세요.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: searchPrompt }] }],
        tools: [{ google_search: {} }],
      }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text);
    const researchData = textParts.join('\n');

    // grounding metadata에서 소스 URL 추출
    const groundingMeta = response.data?.candidates?.[0]?.groundingMetadata;
    const sources = groundingMeta?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) || [];

    console.log(`Research completed: ${researchData.length} chars, ${sources.length} sources`);
    if (sources.length > 0) {
      console.log('Sources:', sources.slice(0, 5).join(', '));
    }

    // 리서치 데이터가 너무 길면 앞부분만 사용 (토큰 절약)
    const trimmedData = researchData.length > 15000 ? researchData.substring(0, 15000) + '\n\n...(이하 생략)' : researchData;
    return { data: trimmedData, sources };
  } catch (e) {
    console.warn('Research with Google Search failed:', e.response?.data?.error?.message || e.message);
    // fallback: Google Search 없이 Gemini 지식만 사용
    console.log('Falling back to Gemini knowledge only...');
    try {
      const fallbackResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: searchPrompt.replace('Google에서 최신 정보를 검색하고, ', '') }] }],
        }
      );
      const text = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { data: text, sources: [] };
    } catch (e2) {
      console.error('Fallback also failed:', e2.message);
      return { data: '', sources: [] };
    }
  }
}

// ─── Step 2: 리서치 데이터 기반으로 글 생성 ──────────────
async function generateContent(category, topic, research) {
  const cityKo = categoryNamesKo[category];
  const fullKeyword = `${cityKo} ${topic.keyword}`;

  const prompt = `당신은 베트남 현지에서 오래 거주한 경험 많은 여행 전문가입니다. 아래 리서치 데이터를 바탕으로 한국인 여행자를 위한 실용적인 여행 가이드를 작성하세요.

[글의 주제]
${fullKeyword}

[리서치 데이터 - 실제 검색 기반 정보]
${research.data || '(리서치 데이터 없음 - 당신의 지식을 기반으로 작성하세요)'}

${research.sources.length > 0 ? `[참고한 출처]\n${research.sources.slice(0, 5).join('\n')}` : ''}

[작성 규칙]
1. 톤: 경험 많은 여행자가 친구에게 알려주는 느낌. 딱딱하지 않되 전문적. 이모지 사용하지 않음.
2. 도입부: "안녕~" 같은 인사 없이, 바로 핵심으로 진입. 예: "${cityKo}에서 뭘 먹어야 할지 고민이라면, 이 글 하나면 충분합니다."
3. 본문 구조:
   - 각 장소/항목마다: 이름(영어 병기) → 2-3문장 설명 → 추천 메뉴/포인트 → 실용 정보(주소, 가격, 영업시간)
   - 짧은 문단 (2-3줄씩)
   - 가격은 반드시 베트남 동 + 한화 환산 병기 (1,000동 ≈ 55원 기준)
   - 소제목은 ## 사용
4. 반드시 리서치 데이터에 있는 실제 장소/식당 이름을 사용. 없는 곳을 만들어내지 마세요.
5. 글 후반부에 "## 가기 전에 알아두면 좋은 것들" 섹션. Q&A가 아닌 경험담처럼 자연스럽게. 예: "저도 처음에 카드만 들고 갔다가 당황했는데, 로컬 식당은 거의 현금만 받습니다."
6. 분량: 3000자 이상, 충실하게 작성
7. 형식: 순수 마크다운 본문만 출력. 제목은 출력하지 마세요. JSON이나 코드블록(\`\`\`) 없이 본문만.

[SEO 키워드 - 글에 자연스럽게 포함]
메인: ${fullKeyword}
서브: ${cityKo} 여행, ${cityKo} 가볼만한곳, 베트남 여행, 베트남 자유여행`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.8,
      },
    }
  );

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!raw) {
    console.error('Gemini returned empty text for:', fullKeyword);
    console.error('Response preview:', JSON.stringify(response.data).substring(0, 500));
    throw new Error('Empty content generated');
  }

  console.log(`Content generated: ${raw.length} chars`);

  // 제목 생성
  const titleTemplates = [
    `${fullKeyword} BEST 7 | 현지인이 진짜 가는 곳만 총정리 (2026)`,
    `${fullKeyword} | 현지 거주자 추천 가이드 (2026)`,
    `${fullKeyword} TOP 5 | 관광객은 모르는 찐 로컬 리스트`,
    `${fullKeyword} 완벽 가이드 | 가격, 위치, 영업시간까지 (2026)`,
  ];
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  const slug = `${category}-${topic.slug}-${Date.now()}`;

  return { title, slug, content: raw };
}

// ─── Step 3: 요약 + 메타 생성 ────────────────────────────
async function generateMeta(title, content, cityKo, keyword) {
  const metaPrompt = `아래 글의 핵심 내용을 기반으로 두 가지를 생성하세요.

제목: ${title}

본문 앞부분:
${content.substring(0, 1500)}

1. summary_5lines: 글의 핵심 정보를 5줄로 요약 (각 줄 앞에 ①②③④⑤ 번호). 구체적인 장소명, 가격 포함.
2. meta_description: SEO용 메타 설명 (150자 이내). "${cityKo} ${keyword}" 키워드 포함.

반드시 아래 형식으로만 출력:
SUMMARY:
(5줄 요약)
META:
(메타 설명)`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: metaPrompt }] }] }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)META:/);
    const metaMatch = text.match(/META:\s*([\s\S]*?)$/);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      metaDescription: metaMatch ? metaMatch[1].trim() : '',
    };
  } catch (e) {
    console.warn('Meta generation failed:', e.message);
    return { summary: '', metaDescription: '' };
  }
}

// ─── Strapi에 포스트 생성 ────────────────────────────────
async function createPost(data, category, image, meta) {
  try {
    const now = new Date().toISOString();
    let articleContent = data.content;

    if (image) {
      articleContent = `![${image.credit}](${image.url})\n*[${image.credit}](${image.link})*\n\n` + articleContent;
    }

    const postData = {
      title: data.title,
      slug: data.slug,
      category: category,
      article_markdown: articleContent,
      summary_5lines: meta.summary || '',
      meta_description: meta.metaDescription || '',
      status: 'published',
      published_at: now,
      publishedAt: now,
    };

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

// ─── 메인 실행 ───────────────────────────────────────────
async function main() {
  console.log('=== Vietnam Magazine Auto Post v3 ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // 1. 기존 포스트 확인
  const existingPosts = await getExistingPosts();
  console.log(`Existing posts: ${existingPosts.length}`);

  // 2. 중복 안 되는 토픽 선택
  const { category, topic } = selectTopic(existingPosts);
  const cityKo = categoryNamesKo[category];
  console.log(`Selected: ${cityKo} / ${topic.keyword}`);

  // 3. 실시간 리서치 (Google Search grounding)
  console.log('Researching with Google Search...');
  const research = await researchTopic(cityKo, topic);
  console.log(`Research data: ${research.data.length} chars`);

  // 4. 기존 이미지 URL 수집 (중복 방지)
  const usedImageUrls = new Set(existingPosts.map(p => p.imageUrl).filter(Boolean));
  console.log(`Used images: ${usedImageUrls.size}`);

  // 5. 글 생성 + 이미지 동시 처리
  console.log('Generating content...');
  const [content, image] = await Promise.all([
    generateContent(category, topic, research),
    getUnsplashImage(category, topic.type, usedImageUrls),
  ]);
  console.log('Generated title:', content.title);

  // 6. 메타 정보 생성
  console.log('Generating meta...');
  const meta = await generateMeta(content.title, content.content, cityKo, topic.keyword);

  // 7. 포스트 발행
  if (image) console.log('Image:', image.url);
  const post = await createPost(content, category, image, meta);
  console.log(`Post created: ID ${post.data?.id}`);
  console.log('=== Done ===');
}

main().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
