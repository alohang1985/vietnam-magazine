const axios = require('axios');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function main() {
  const res = await axios.get(
    `${STRAPI_URL}/api/posts?pagination[pageSize]=100`,
    { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  );
  const posts = res.data.data || [];
  let fixed = 0;

  for (const post of posts) {
    let md = post.attributes.article_markdown || '';

    // 예산 비교/가이드 섹션 제거 (## 예산 부터 다음 ## 또는 끝까지)
    const budgetPattern = /\n*#{1,3}\s*예산\s*(비교|가이드|정리|총정리)[^\n]*\n[\s\S]*?(?=\n#{1,3}\s|\s*$)/g;
    const newMd = md.replace(budgetPattern, '');

    if (newMd !== md) {
      try {
        await axios.put(
          `${STRAPI_URL}/api/posts/${post.id}`,
          { data: { article_markdown: newMd.trimEnd() } },
          { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        console.log(`Fixed: ID ${post.id} - ${(post.attributes.title || '').substring(0, 50)}`);
        fixed++;
      } catch (e) {
        console.error(`Failed ID ${post.id}:`, e.response?.data?.error?.message || e.message);
      }
    }
  }
  console.log(`Done: ${fixed} posts cleaned`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
