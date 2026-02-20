const fetch = require('node-fetch');
const fs = require('fs');
const logger = require('./utils/logger');
require('dotenv').config();

const CMS_URL = process.env.CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.CMS_ADMIN_TOKEN;
if (!TOKEN) { logger.error('CMS_ADMIN_TOKEN missing'); process.exit(1); }

async function findApproved() {
  const findRes = await fetch(`${CMS_URL}/api/posts?filters[status][$eq]=approved&filters[published_at][$null]=true&sort[0]=updated_at:asc&pagination[limit]=1`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const jf = await findRes.json();
  const p = jf.data && jf.data[0];
  return p || null;
}

async function acquireAndPublish(id) {
  // Call Strapi custom endpoint to perform check-and-set publish
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
