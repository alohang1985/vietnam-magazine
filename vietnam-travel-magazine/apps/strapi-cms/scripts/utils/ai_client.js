const { Configuration, OpenAIApi } = require('openai');

let client = null;
let lastCallTs = 0;
const RATE_LIMIT = Number(process.env.OPENAI_RATE_LIMIT || 60); // calls per minute
const MIN_INTERVAL_MS = Math.ceil(60000 / Math.max(1, RATE_LIMIT));
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 30000);

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function getClient() {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const conf = new Configuration({ apiKey: key });
  client = new OpenAIApi(conf);
  return client;
}

async function callWithTimeout(promise, ms) {
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));
  return Promise.race([promise, timeout]);
}

async function generateArticle(systemPrompt, userPrompt, maxTokens=3000) {
  const ai = getClient();
  // rate limit: ensure min interval between calls
  const now = Date.now();
  const since = now - lastCallTs;
  if (since < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - since);

  // retry with exponential backoff
  let attempt = 0;
  const maxAttempts = 4;
  let backoff = 1000;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      lastCallTs = Date.now();
      const req = ai.createChatCompletion({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], max_tokens: maxTokens });
      const res = await callWithTimeout(req, TIMEOUT_MS);
      return res.data.choices[0].message.content;
    } catch (e) {
      if (attempt >= maxAttempts) throw e;
      await sleep(backoff);
      backoff *= 2;
    }
  }
}

module.exports = { generateArticle }
