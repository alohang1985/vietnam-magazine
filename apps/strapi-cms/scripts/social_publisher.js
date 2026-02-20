const fs = require('fs');
const logger = require('./utils/logger');

async function publishToPlatform(platform, payload) {
  // In live mode, this would call platform APIs. Here we simulate or skip based on env keys.
  try {
    if (process.env.TEST_MODE === 'mock') {
      logger.info(`SOCIAL: mock publish to ${platform}`);
      return { ok: true, platform };
    }
    switch(platform) {
      case 'facebook':
        if (!process.env.FB_PAGE_TOKEN) return { ok: false, reason: 'no_token' };
        // TODO: implement FB publish
        return { ok: true, platform };
      case 'instagram':
        if (!process.env.IG_ACCESS_TOKEN) return { ok: false, reason: 'no_token' };
        return { ok: true, platform };
      case 'x':
        if (!process.env.X_API_KEY) return { ok: false, reason: 'no_token' };
        return { ok: true, platform };
      case 'threads':
        // Threads uses IG token in many flows; skip if none
        if (!process.env.IG_ACCESS_TOKEN) return { ok: false, reason: 'no_token' };
        return { ok: true, platform };
      case 'naver':
        if (!process.env.NAVER_CLIENT_ID) return { ok: false, reason: 'no_token' };
        return { ok: true, platform };
      default:
        return { ok: false, reason: 'unsupported' };
    }
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function publishAll(payload) {
  const platforms = ['facebook','instagram','threads','x','naver'];
  const results = [];
  for (const p of platforms) {
    let attempts = 0;
    let res;
    while (attempts < 3) {
      attempts++;
      res = await publishToPlatform(p, payload);
      if (res.ok) break;
    }
    results.push({ platform: p, ok: !!res.ok, reason: res.reason || null });
    fs.appendFileSync('./logs/social.log', `${new Date().toISOString()} | ${p} | ${res.ok} | ${res.reason || ''}\n`);
  }
  return results;
}

module.exports = { publishAll };
