const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();
const CMS_URL = process.env.CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.CMS_ADMIN_TOKEN;

async function generate() {
  const res = await fetch(`${CMS_URL}/api/posts?filters[status][$eq]=published&pagination[limit]=1000&sort[0]=published_at:desc`, { headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {} });
  const j = await res.json();
  const posts = j.data || [];
  const urls = posts.map(p=>`${process.env.SITE_BASE_URL || 'http://localhost:3000'}/posts/${p.attributes.slug}`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>`;
  const outDir = './apps/frontend-next/public';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outDir + '/sitemap.xml', xml);
  console.log('sitemap written with', urls.length, 'entries');
}

if (require.main === module) generate().catch(e=>{ console.error(e); process.exit(1); });
module.exports = { generate };
