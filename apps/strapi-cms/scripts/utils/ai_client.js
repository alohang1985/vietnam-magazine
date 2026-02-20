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
  const { Configuration, OpenAIApi } = require('openai');
  const conf = new Configuration({ apiKey: key });
  client = new OpenAIApi(conf);
  return client;
}

async function callWithTimeout(promise, ms) {
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));
  return Promise.race([promise, timeout]);
}

async function generateArticle(systemPrompt, userPrompt, maxTokens=3000) {
  if (process.env.TEST_MODE === 'mock') {
    // return a deterministic mock JSON string that the pipeline expects
    return JSON.stringify({
      titles: ['Mock Title 1','Mock Title 2','Mock Title 3','Mock Title 4','Mock Title 5'],
      summary: 'Mock summary line 1\nline2\nline3\nline4\nline5',
      outline: ['Intro','Morning','Lunch','Afternoon','Evening','Tips','FAQ'],
      article_markdown: '가'.repeat(3000),
      itineraries: { half_day: 'half', one_day: 'one', two_day: 'two' },
      budget_table: { low: { accommodation:10,food:10,transport:5,activity:10,total:35 }, mid: { accommodation:50,food:30,transport:10,activity:30,total:120 }, high: { accommodation:150,food:80,transport:40,activity:150,total:420 } },
      faq: [ { q:'Q1', a:'A1' }, { q:'Q2', a:'A2' }, { q:'Q3', a:'A3' }, { q:'Q4', a:'A4' }, { q:'Q5', a:'A5' } ],
      seo: { meta_title: 'Mock Meta', meta_description: 'Mock description', tags: ['mock','test'], slug: 'mock-slug' },
      sources: [],
      editor_note: 'mock'
    });
  }

  const ai = getClient();
  const now = Date.now();
  const since = now - lastCallTs;
  if (since < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - since);

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
