/*
  자동 게시 스크립트 (간단 구현)
  - Google Gemini (Generative AI)로 한국어 베트남 여행 글 생성
  - 랜덤 카테고리 선택
  - Strapi에 POST /api/posts 로 업로드 후 published_at 설정으로 발행

  환경변수:
  - GEMINI_API_KEY: Gemini/Google Generative API 키
  - STRAPI_API_TOKEN: Strapi API Token (권한: create/publish posts)
  - STRAPI_URL: Strapi 베이스 URL (예: https://vietnam-magazine-production.up.railway.app)

  주의: 실제 운영 전 테스트 후 사용하세요. 에러 핸들링을 보완하고 리트라이/로깅을 추가 권장.
*/

const axios = require('axios');

const CATEGORIES = [
  'phu-quoc','nha-trang','da-nang','ho-chi-minh','hanoi','ha-long','dalat','hoi-an','sapa','mui-ne','other'
];

function slugify(text){
  return text.toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g,'')
    .trim()
    .replace(/\s+/g,'-')
    .slice(0,200);
}

async function generateArticle(titleSeed){
  const prompt = `한국어로 베트남 여행 관련 기사 작성. 제목 후보: "${titleSeed}".\n- 분량: 최소 800자(한글 기준)\n- 형식: article_markdown 필드에 넣을 수 있는 마크다운(단락, 소제목 포함)
- 톤: 친절하고 정보 중심, 여행 정보(이동,추천장소,예산 팁)를 포함`;

  // 간단한 Gemini 호출 예시(REST 형태). 실제 엔드포인트/파라미터는 사용 중인 Gemini API에 맞춰 조정하세요.
  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) throw new Error('GEMINI_API_KEY not set');

  try{
    const res = await axios.post('https://gemini.googleapis.com/v1/models/text-bison-001:generate',
      { prompt, temperature: 0.7, max_output_tokens: 1500 },
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    // 응답 구조는 실제 API에 맞춰 조정 필요
    const text = (res.data && (res.data.output_text || (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content))) || JSON.stringify(res.data);
    return text;
  }catch(err){
    throw new Error('Gemini generation failed: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
  }
}

async function createPostOnStrapi({title, slug, category, article_markdown}){
  const STRAPI_URL = process.env.STRAPI_URL;
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
  if(!STRAPI_URL || !STRAPI_API_TOKEN) throw new Error('STRAPI_URL or STRAPI_API_TOKEN not set');

  const payload = {
    data: {
      title,
      slug,
      category,
      article_markdown,
      published_at: new Date().toISOString()
    }
  };

  try{
    const res = await axios.post(`${STRAPI_URL.replace(/\/$/, '')}/api/posts`, payload, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  }catch(err){
    throw new Error('Strapi post failed: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
  }
}

function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

(async function main(){
  try{
    const category = pickRandom(CATEGORIES);
    const titleSeed = {
      'phu-quoc': '푸꿕 완전 가이드',
      'nha-trang': '나트랑의 바다와 먹거리',
      'da-nang': '다낭에서 즐기는 주말',
      'ho-chi-minh': '호치민 48시간',
      'hanoi': '하노이 숨은 골목 투어',
      'ha-long': '하롱베이 보트 여행 팁',
      'dalat': '달랏의 커피와 자연',
      'hoi-an': '호이안 느긋한 여행',
      'sapa': '사파 트레킹 초보 가이드',
      'mui-ne': '무이네의 모래언덕과 액티비티',
      'other': '베트남의 숨은 여행지'
    }[category] || '베트남 여행 가이드';

    console.log('Selected category:', category);
    const generated = await generateArticle(titleSeed);

    // 간단 길이 체크(한글 기준 대략 자모 수)
    const plain = generated.replace(/\s+/g,' ').trim();
    if(plain.length < 800){
      console.warn('Generated text shorter than 800 chars, retrying...');
      // 간단 재시도 한 번
      const retry = await generateArticle(titleSeed + ' 자세히 설명');
      if(retry.replace(/\s+/g,' ').trim().length >= 800) generated = retry;
    }

    // 제목은 생성 텍스트의 첫 문장을 제목으로 사용(간단 추출)
    const firstLine = plain.split('\n').find(l => l && l.trim().length>0) || titleSeed;
    const title = firstLine.length>120 ? firstLine.slice(0,120) : firstLine;
    const slug = slugify(title);

    console.log('Final title:', title);

    const postRes = await createPostOnStrapi({ title, slug, category, article_markdown: generated });

    console.log('Posted to Strapi:', JSON.stringify(postRes, null, 2));
  }catch(err){
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
