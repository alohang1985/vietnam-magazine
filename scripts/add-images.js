const axios = require('axios');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const categorySearchTerms = {
  'phu-quoc': 'phu quoc island vietnam beach',
  'nha-trang': 'nha trang vietnam beach',
  'da-nang': 'da nang vietnam city beach',
  'ho-chi-minh': 'ho chi minh city vietnam street',
  'hanoi': 'hanoi vietnam old quarter',
  'ha-long': 'halong bay vietnam cruise',
  'dalat': 'dalat vietnam flower',
  'hoi-an': 'hoi an vietnam lantern',
  'sapa': 'sapa vietnam rice terrace',
  'mui-ne': 'mui ne vietnam sand dune',
};

async function getUnsplashImage(query) {
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 10, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const photos = res.data.results || [];
    const photo = photos[Math.floor(Math.random() * photos.length)];
    if (!photo) return null;
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

function hasImageInMarkdown(markdown) {
  if (!markdown) return false;
  return markdown.startsWith('![') || markdown.includes('\n![');
}

async function main() {
  console.log('=== Adding images to existing posts ===');

  // 모든 포스트 가져오기
  const res = await axios.get(
    `${STRAPI_URL}/api/posts?pagination[pageSize]=100`,
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  );
  const posts = res.data.data || [];
  console.log(`Total posts: ${posts.length}`);

  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const attr = post.attributes;
    const markdown = attr.article_markdown || '';

    // 이미 이미지가 있는 포스트는 스킵
    if (hasImageInMarkdown(markdown)) {
      console.log(`Skip (has image): ID ${post.id} - ${attr.title?.substring(0, 40)}`);
      skipped++;
      continue;
    }

    const category = attr.category || 'vietnam';
    const searchTerm = categorySearchTerms[category] || 'vietnam travel';

    // 타이틀에서 키워드 추출해서 검색어 보강
    const title = attr.title || '';
    let extraTerm = '';
    if (title.includes('맛집') || title.includes('음식')) extraTerm = 'food restaurant';
    else if (title.includes('카페') || title.includes('커피')) extraTerm = 'cafe coffee';
    else if (title.includes('호텔') || title.includes('숙소') || title.includes('리조트')) extraTerm = 'hotel resort';
    else if (title.includes('해변') || title.includes('비치')) extraTerm = 'beach ocean';
    else if (title.includes('야시장')) extraTerm = 'night market';
    else if (title.includes('마사지') || title.includes('스파')) extraTerm = 'spa massage';
    else if (title.includes('다이빙') || title.includes('스노클링')) extraTerm = 'diving snorkeling';
    else extraTerm = 'travel';

    const query = `${searchTerm} ${extraTerm}`;
    const image = await getUnsplashImage(query);

    if (!image) {
      console.log(`No image found: ID ${post.id} - ${title.substring(0, 40)}`);
      continue;
    }

    // 마크다운 앞에 이미지 추가
    const newMarkdown = `![${image.credit}](${image.url})\n*[${image.credit}](${image.link})*\n\n${markdown}`;

    try {
      await axios.put(
        `${STRAPI_URL}/api/posts/${post.id}`,
        { data: { article_markdown: newMarkdown } },
        { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
      );
      console.log(`Updated: ID ${post.id} - ${title.substring(0, 40)}`);
      updated++;
    } catch (e) {
      console.error(`Failed to update ID ${post.id}:`, e.response?.data?.error?.message || e.message);
    }

    // Unsplash API rate limit 방지 (50 req/hour)
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Done: ${updated} updated, ${skipped} skipped ===`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
