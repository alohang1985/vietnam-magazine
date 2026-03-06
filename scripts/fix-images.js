const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const categorySearchTerms = {
  'phu-quoc': 'phu quoc island vietnam', 'nha-trang': 'nha trang vietnam beach',
  'da-nang': 'da nang vietnam', 'ho-chi-minh': 'ho chi minh city vietnam',
  'hanoi': 'hanoi vietnam old quarter', 'ha-long': 'halong bay vietnam',
  'dalat': 'dalat vietnam', 'hoi-an': 'hoi an vietnam lantern',
  'sapa': 'sapa vietnam rice', 'mui-ne': 'mui ne vietnam sand',
};

async function getUniqueImage(query, usedUrls, page) {
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 30, orientation: 'landscape', page: page || 1 },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const photos = res.data.results || [];
    // 이미 사용된 URL 제외
    const available = photos.filter(p => !usedUrls.has(p.urls.regular));
    if (available.length === 0) return null;
    const photo = available[Math.floor(Math.random() * available.length)];
    return {
      url: photo.urls.regular,
      credit: `Photo by ${photo.user.name} on Unsplash`,
      link: photo.links.html,
    };
  } catch (e) {
    console.error('Unsplash error:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== Fix duplicate & missing images ===');

  const res = await axios.get(
    `${STRAPI_URL}/api/posts?pagination[pageSize]=100`,
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  );
  const posts = res.data.data || [];

  // 모든 사용중인 이미지 URL 수집
  const usedUrls = new Set();
  const urlToPostIds = {};
  const postsNeedingImage = [];

  posts.forEach(p => {
    const md = p.attributes.article_markdown || '';
    const match = md.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    if (match) {
      const url = match[1];
      if (!urlToPostIds[url]) urlToPostIds[url] = [];
      urlToPostIds[url].push(p.id);
      usedUrls.add(url);
    } else {
      postsNeedingImage.push(p);
    }
  });

  // 중복된 이미지 찾기 (첫 번째는 유지, 나머지는 교체)
  const dupePostIds = new Set();
  Object.entries(urlToPostIds).forEach(([url, ids]) => {
    if (ids.length > 1) {
      ids.slice(1).forEach(id => dupePostIds.add(id));
    }
  });

  console.log(`Duplicates to fix: ${dupePostIds.size}`);
  console.log(`Missing images: ${postsNeedingImage.length}`);

  // 교체할 포스트 목록
  const toFix = [
    ...posts.filter(p => dupePostIds.has(p.id)),
    ...postsNeedingImage,
  ];

  let fixed = 0;
  for (const post of toFix) {
    const attr = post.attributes;
    const category = attr.category || 'vietnam';
    const searchTerm = categorySearchTerms[category] || 'vietnam travel';
    const title = attr.title || '';

    let extra = 'travel';
    if (title.includes('맛집') || title.includes('음식')) extra = 'food';
    else if (title.includes('카페')) extra = 'cafe';
    else if (title.includes('호텔') || title.includes('숙소')) extra = 'hotel';
    else if (title.includes('야시장')) extra = 'night market';
    else if (title.includes('마사지')) extra = 'spa';
    else if (title.includes('해변')) extra = 'beach';

    // 페이지를 바꿔가며 유니크한 이미지 찾기
    let image = null;
    for (let page = 1; page <= 3; page++) {
      image = await getUniqueImage(`${searchTerm} ${extra}`, usedUrls, page);
      if (image) break;
    }

    if (!image) {
      console.log(`No unique image for ID ${post.id}: ${title.substring(0, 40)}`);
      continue;
    }

    usedUrls.add(image.url);

    let md = attr.article_markdown || '';
    // 기존 이미지가 있으면 교체, 없으면 앞에 추가
    const imgLine = `![${image.credit}](${image.url})\n*[${image.credit}](${image.link})*`;
    if (md.match(/^!\[.*?\]\(https?:\/\/[^)]+\)\n\*\[.*?\]\(https?:\/\/[^)]+\)\*/)) {
      md = md.replace(/^!\[.*?\]\(https?:\/\/[^)]+\)\n\*\[.*?\]\(https?:\/\/[^)]+\)\*/, imgLine);
    } else {
      md = imgLine + '\n\n' + md;
    }

    try {
      await axios.put(
        `${STRAPI_URL}/api/posts/${post.id}`,
        { data: { article_markdown: md } },
        { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
      );
      console.log(`Fixed: ID ${post.id} - ${title.substring(0, 40)}`);
      fixed++;
    } catch (e) {
      console.error(`Failed ID ${post.id}:`, e.response?.data?.error?.message || e.message);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Done: ${fixed} fixed ===`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
