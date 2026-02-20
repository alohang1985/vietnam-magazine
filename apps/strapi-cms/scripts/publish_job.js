const fetch = require('node-fetch');
const fs = require('fs');
const logger = require('./utils/logger');
try { require('dotenv').config(); } catch(e) {}

const CMS_URL = process.env.CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.CMS_ADMIN_TOKEN;
const MOCK = process.env.TEST_MODE === 'mock';
if (!TOKEN && !MOCK) { logger.error('CMS_ADMIN_TOKEN missing'); process.exit(1); }

async function findApproved() {
  if (MOCK) {
    const mp = require('path').join(__dirname, '../mock_posts.json');
    if (!require('fs').existsSync(mp)) return null;
    const posts = JSON.parse(require('fs').readFileSync(mp,'utf8')) || [];
    // return first mock post and mark as 'approved' in file
    if (posts.length === 0) return null;
    const p = posts.shift();
    // save remaining
    require('fs').writeFileSync(mp, JSON.stringify(posts, null, 2));
    return { id: p.id, attributes: { ...p, status: 'approved' } };
  }
  const findRes = await fetch(`${CMS_URL}/api/posts?filters[status][$eq]=approved&filters[published_at][$null]=true&sort[0]=updated_at:asc&pagination[limit]=1`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const jf = await findRes.json();
  const p = jf.data && jf.data[0];
  return p || null;
}

async function acquireAndPublish(id) {
  if (MOCK) {
    // simulate publish by returning success and record published mock
    const mpub = require('path').join(__dirname, '../mock_published.json');
    const entry = { id, published_at: new Date().toISOString() };
    let arr = [];
    if (require('fs').existsSync(mpub)) {
      try { arr = JSON.parse(require('fs').readFileSync(mpub,'utf8')); } catch(e){ arr = []; }
    }
    arr.push(entry);
    require('fs').writeFileSync(mpub, JSON.stringify(arr, null, 2));
    // trigger social publisher (best-effort)
    try {
      const sp = require('./social_publisher');
      const payload = { title: id, url: `${process.env.SITE_BASE_URL||'http://localhost:3000'}/posts/${id}`, summary: '자동 발행된 데모 포스트' };
      sp.publishAll(payload).then(r=>{
        // log results
      }).catch(()=>{});
    } catch(e){}
    return { data: { id, attributes: { status: 'published', published_at: entry.published_at, publish_lock: false } } };
  }
  const res = await fetch(`${CMS_URL}/api/posts/${id}/publish`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}` } });
  return res.json();
}

async function run() {
  logger.info('Publish job start');
  try {
    const p = await findApproved();
    if (!p) { logger.info('No approved post to publish'); return; }
    const id = p.id;
    const res = await acquireAndPublish(id);
    logger.info('Publish result: ' + JSON.stringify(res));
  } catch (e) {
    logger.error('Publish job error: ' + e.message);
    // retry with exponential backoff up to 3 times
    for (let i=1;i<=3;i++) {
      try {
        await new Promise(r=>setTimeout(r, i*2000));
        const locked = await findAndLockApproved();
        if (!locked) { logger.info('No approved post to publish on retry'); break; }
        const id = locked.id;
        const res = await publishPost(id);
        logger.info('Publish retry result: ' + JSON.stringify(res));
        break;
      } catch (e2) { logger.error('Retry error: '+e2.message); }
    }
  }
}

if (require.main === module) run().catch(e=>{ logger.error(e.message); process.exit(1); });

module.exports = { run };
