/*
Seed script: posts two sample Vietnam travel posts via Strapi REST API.
Requires CMS_ADMIN_TOKEN and CMS_URL in env or .env
Usage: node scripts/seed_posts.js
*/
const fetch = require('node-fetch');
require('dotenv').config();

const CMS_URL = process.env.CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.CMS_ADMIN_TOKEN;
if (!TOKEN) {
  console.error('CMS_ADMIN_TOKEN not set in env');
  process.exit(1);
}

const posts = [
  {
    title: '나트랑 다운타운: 현지인처럼 1일 일정',
    slug: 'nha-trang-downtown-1-day',
    category: 'nha-trang',
    tags: ['nha-trang','beach','city','food'],
    status: 'review',
    meta_title: '나트랑 다운타운 1일 가이드',
    meta_description: '현지인 추천 코스와 먹거리, 교통 팁을 담은 나트랑 1일 일정 가이드',
    hero_image: { source: 'unsplash', url: 'https://images.unsplash.com/photo-1493550949172-37a3b2f6b8c9', photographer: 'Unsplash', license_url: 'https://unsplash.com' },
    section_images: [
      { source: 'unsplash', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', photographer: 'Unsplash', license_url: 'https://unsplash.com' },
      { source: 'pexels', url: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg', photographer: 'Pexels', license_url: 'https://www.pexels.com' },
      { source: 'unsplash', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', photographer: 'Unsplash', license_url: 'https://unsplash.com' }
    ],
    outline: ['도착 및 오전: 해변 산책','점심: 해산물 맛집','오후: 문화 공간과 카페','저녁: 야시장과 바'],
    article_markdown: '# 나트랑 다운타운 1일 일정\n\n바다와 도시가 어우러진 나트랑에서 현지인처럼 하루를 보내는 방법을 소개합니다.\n\n## 도착 및 오전: 해변 산책\n\n푸른 바다를 앞에 두고 여유롭게 산책하며 현지 카페에서 코코넛 커피를 마셔보세요.\n\n## 점심: 해산물 맛집\n\n항구 근처 식당에서 신선한 해산물을 합리적인 가격에 즐길 수 있습니다.\n\n## 오후: 문화 공간과 카페\n\n작은 갤러리와 로컬 카페를 방문해 휴식을 취하세요.\n\n## 저녁: 야시장과 바\n\n현지 야시장에서 길거리 음식을 맛보고, 바닷가 바에서 칵테일로 하루를 마무리하세요.\n',
    summary_5lines: '나트랑 다운타운에서 현지인처럼 즐기는 1일 코스. 해변 산책 → 신선한 해산물 → 로컬 카페 → 야시장까지.',
    itinerary_blocks: { half_day: '해변과 카페 중심', one_day: '해변+점심+카페+야시장', two_day: '주변 섬 투어 추가' },
    budget_table: { low: { accommodation: 20, food: 15, transport: 5, activity: 10, total: 50 }, mid: { accommodation: 50, food: 30, transport: 10, activity: 30, total: 120 }, high: { accommodation: 150, food: 80, transport: 40, activity: 120, total: 390 } },
    faq: [ { q: '환전은 어디서?', a: '도심 환전소 또는 공항' }, { q: '로컬 SIM?', a: '공항이나 시내 매장에서 구매 가능' } ],
    sources: [ { type: 'magazine', url: 'https://www.lonelyplanet.com', title: 'Lonely Planet - Nha Trang' } ],
    editor_note: '수집: Lonely Planet 외 2건. 이미지: Unsplash/ Pexels 믹스. 품질점수 8'
  },
  {
    title: '푸꾸옥 섬 반나절 추천 코스',
    slug: 'phu-quoc-half-day',
    category: 'phu-quoc',
    tags: ['phu-quoc','island','beach','snorkel'],
    status: 'review',
    meta_title: '푸꾸옥 반나절 추천',
    meta_description: '푸꾸옥에서 반나절 동안 즐길 수 있는 스노클링과 로컬 마켓 추천',
    hero_image: { source: 'pexels', url: 'https://images.pexels.com/photos/1450352/pexels-photo-1450352.jpeg', photographer: 'Pexels', license_url: 'https://www.pexels.com' },
    section_images: [
      { source: 'pexels', url: 'https://images.pexels.com/photos/1450352/pexels-photo-1450352.jpeg', photographer: 'Pexels', license_url: 'https://www.pexels.com' },
      { source: 'unsplash', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', photographer: 'Unsplash', license_url: 'https://unsplash.com' },
      { source: 'pexels', url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg', photographer: 'Pexels', license_url: 'https://www.pexels.com' }
    ],
    outline: ['해양 액티비티','로컬 마켓','선셋 포인트'],
    article_markdown: '# 푸꾸옥 반나절 추천 코스\n\n푸꾸옥에서 반나절만 투자해도 즐거운 액티비티를 경험할 수 있습니다.\n\n## 해양 액티비티\n\n스노클링과 짧은 보트 투어를 추천합니다.\n\n## 로컬 마켓\n\n현지 고기, 해산물 말린 제품을 구경하고 기념품을 사보세요.\n\n## 선셋 포인트\n\n해질녘의 바다 풍경은 반드시 경험해볼 가치가 있습니다.\n',
    summary_5lines: '푸꾸옥 반나절 추천: 스노클링 → 마켓 → 선셋',
    itinerary_blocks: { half_day: '스노클링 + 마켓', one_day: '섬일주', two_day: '섬일주 + 근교섬 투어' },
    budget_table: { low: { accommodation: 10, food: 10, transport: 10, activity: 20, total: 50 }, mid: { accommodation: 40, food: 30, transport: 20, activity: 60, total: 150 }, high: { accommodation: 120, food: 80, transport: 40, activity: 200, total: 440 } },
    faq: [ { q: '스노클링 장비 대여?', a: '리조트나 해변 장비 대여소에서 가능' } ],
    sources: [ { type: 'naver', url: 'https://blog.naver.com', title: '네이버 블로그 - Phu Quoc' } ],
    editor_note: '수집: 네이버 블로그 3건, 이미지 확보 완료. 품질점수 7'
  }
];

(async () => {
  for (const p of posts) {
    try {
      const res = await fetch(`${CMS_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ data: p })
      });
      const j = await res.json();
      console.log('Created:', j.data ? j.data.attributes.title : JSON.stringify(j));
    } catch (e) {
      console.error('Error creating post', e);
    }
  }
})();
