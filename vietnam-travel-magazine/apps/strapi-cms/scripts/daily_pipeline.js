const fetch = require('node-fetch');
const { extractText, extractStructuredNotes } = require('./utils/extractor');
const { searchUnsplash, searchPexels } = require('./utils/image_client');
const { generateArticle } = require('./utils/ai_client');
const logger = require('./utils/logger');
const httpFetch = require('./utils/http');
require('dotenv').config();

const CMS_URL = process.env.CMS_URL || 'http://localhost:1337';
const TOKEN = process.env.CMS_ADMIN_TOKEN;
if (!TOKEN) { logger.error('CMS_ADMIN_TOKEN missing'); process.exit(1); }
const UNSPLASH = process.env.UNSPLASH_API_KEY || '';
const PEXELS = process.env.PEXELS_API_KEY || '';
const OPENAI = process.env.OPENAI_API_KEY || '';

const TOPICS = [
  '나트랑 카페 거리', '푸꾸옥 일몰 포인트', '다낭 1일 액티비티', '호치민 야시장', '하노이 길거리 음식'
];

async function webSearch(query, limit=10) {
  // Primary: DuckDuckGo HTML
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await httpFetch(url);
    const $ = require('cheerio').load(res.text);
    const links = [];
    $('a.result__a').each((i,el)=>{ const href = $(el).attr('href'); if (href) links.push(href); });
    if (links.length>0) return links.slice(0, limit);
  } catch (e) { logger.error('DuckDuckGo search failed: '+e.message); }

  // Fallback: SerpAPI / Google Custom Search if SEARCH_API_KEY provided
  const SEARCH_KEY = process.env.SEARCH_API_KEY || '';
  if (SEARCH_KEY) {
    try {
      // SerpAPI example
      const serp = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SEARCH_KEY}`);
      const sj = await serp.json();
      const organic = sj.organic_results || sj.orgics || [];
      const out = [];
      (organic||[]).forEach(r=>{ if (r.link) out.push(r.link); else if (r.url) out.push(r.url); });
      if (out.length>0) return out.slice(0, limit);
    } catch (e) { logger.error('SerpAPI search failed: '+e.message); }
  }

  // Last resort: return empty
  return [];
}

function isPaywalled(html) {
  const low = html.toLowerCase();
  if (low.includes('paywall') || low.includes('subscription') || low.includes('login to continue') || low.includes('read our premium')) return true;
  return false;
}

async function fetchAndExtract(url) {
  try {
    const { status, text } = await httpFetch(url);
    if (status >= 400) return null;
    if (isPaywalled(text)) return null;
    const txt = extractText(text);
    if (!txt || txt.length < 200) return null;
    const notes = extractStructuredNotes(txt);
    return { url, text: txt, notes };
  } catch (e) {
    logger.error('fetchAndExtract error: ' + e.message);
    return null;
  }
}

function buildSystemPrompt() {
  return `You are a professional travel magazine editor. Produce an original, non-plagiarized article in Korean for a Vietnam travel premium magazine.

Requirements:
- Provide 5 title candidates (mix of clickbait and informative)
- Provide a 5-line summary
- Provide 6-9 logical subheadings
- Article body: at least 3000 Korean characters, original wording (no copy from sources)
- Provide 3 itineraries: half-day, 1-day, 2-day
- Provide budget table for low/mid/high with fields: accommodation, food, transport, activity, total
- Provide 5 FAQ entries
- Provide SEO meta_title (<=60 chars), meta_description (<=160 chars), and 8 tags
- Use data points from provided structured notes but do not copy sentences. Cite sources list at the end as links (reference only).

Output must be JSON with keys: titles (array of 5), summary (string), outline (array), article_markdown (string), itineraries (object), budget_table (object), faq (array of {q,a}), seo (object: meta_title, meta_description, tags, slug), sources (array), editor_note (string).
`;
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120); }

async function searchImages(keywords) {
  const imgs = [];
  const terms = Array.isArray(keywords) ? keywords : [keywords];
  for (const t of terms) {
    const u = await searchUnsplash(t, UNSPLASH, 5).catch(()=>[]);
    const p = await searchPexels(t, PEXELS, 5).catch(()=>[]);
    imgs.push(...u, ...p);
    if (imgs.length>=6) break;
  }
  return imgs.slice(0,6);
}

async function createPostInCMS(data) {
  const res = await fetch(`${CMS_URL}/api/posts`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${TOKEN}` }, body: JSON.stringify({ data }) });
  return res.json();
}

async function pipelineRun() {
  logger.info('Pipeline start');
  // Step1: topic candidates
  const candidates = TOPICS.sort(()=>0.5-Math.random()).slice(0,5);
  logger.info('Candidates: ' + candidates.join(', '));

  // choose first candidate by default
  const chosen = candidates[0];

  // Step2: collect sources (web search)
  const searchQueries = [chosen + ' travel', chosen + ' guide', chosen + ' best', chosen + ' blog'];
  const urls = [];
  for (const q of searchQueries) {
    const found = await webSearch(q, 10).catch(e=>{ logger.error('webSearch error '+e.message); return []; });
    for (const u of found) {
      if (!urls.includes(u)) urls.push(u);
      if (urls.length>=10) break;
    }
    if (urls.length>=10) break;
  }
  logger.info('Found URLs: ' + urls.length);

  // fetch and extract up to 6 good sources
  const sources = [];
  for (const u of urls) {
    if (sources.length>=6) break;
    const ex = await fetchAndExtract(u);
    if (ex) sources.push({ url: u, text: ex.text });
  }

  if (sources.length < 3) {
    logger.error('Insufficient sources found: ' + sources.length);
  }

  // Step3: Use AI to extract structured notes from each source (AI-based extraction)
  const aggregated = { places:[], route:[], duration:[], prices:[], booking:[], warnings:[], transport:[], opening_hours:[], tips:[] };
  for (const s of sources) {
    const aiNotes = await require('./utils/extractor').extractStructuredNotesAI(s.text, s.url).catch(e=>null);
    if (!aiNotes) continue;
    for (const k of Object.keys(aggregated)) {
      if (Array.isArray(aiNotes[k])) aggregated[k].push(...aiNotes[k]); else if (aiNotes[k]) aggregated[k].push(aiNotes[k]);
    }
  }
  Object.keys(aggregated).forEach(k=>{ aggregated[k] = [...new Set(aggregated[k].slice(0,50))]; });

  // Step4: AI generation + validation (max 2 retries)
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Topic: ${chosen}\nSources:\n${sources.map(s=>s.url).join('\n')}\nStructuredNotes:\n${JSON.stringify(aggregated)}\nPlease produce JSON output as requested.`;

  let attempt = 0; let articleJSON = null;
  while (attempt < 3) {
    attempt++;
    try {
      const out = await generateArticle(systemPrompt, userPrompt, 3500);
      const firstBrace = out.indexOf('{');
      const jsonText = out.slice(firstBrace);
      articleJSON = JSON.parse(jsonText);
    } catch (e) {
      logger.error('AI generation/parsing error: ' + e.message);
      articleJSON = null;
    }
    if (!articleJSON) { logger.error('generation failed, retrying'); continue; }
    const hasAll = articleJSON.titles && articleJSON.titles.length>=5 && articleJSON.summary && articleJSON.outline && articleJSON.outline.length>=6 && articleJSON.article_markdown && articleJSON.article_markdown.length>=3000 && articleJSON.itineraries && articleJSON.budget_table && articleJSON.faq && articleJSON.faq.length>=5 && articleJSON.seo;
    if (hasAll) break;
    logger.error('validation failed on attempt '+attempt);
  }
  if (!articleJSON) { logger.error('AI generation failed after retries'); return; }

  // Step5: images
  const imgKeywords = [chosen, ...articleJSON.outline.slice(0,3)];
  const imgs = await searchImages(imgKeywords);
  const hero = imgs[0] || null; const sections = imgs.slice(1,4);

  // Step6: prepare post payload
  const post = {
    title: articleJSON.titles[0],
    slug: articleJSON.seo.slug || slugify(articleJSON.titles[0]),
    category: chosen.split(' ')[0].toLowerCase() || 'other',
    tags: articleJSON.seo.tags || [],
    status: 'review',
    meta_title: articleJSON.seo.meta_title,
    meta_description: articleJSON.seo.meta_description,
    hero_image: hero || { source:'unspecified', url:'', photographer:'', license_url:'' },
    section_images: sections.map(s=>s||{source:'',url:'',photographer:'',license_url:''}),
    outline: articleJSON.outline,
    article_markdown: articleJSON.article_markdown,
    summary_5lines: articleJSON.summary,
    itinerary_blocks: articleJSON.itineraries,
    budget_table: articleJSON.budget_table,
    faq: articleJSON.faq,
    sources: sources.map(s=>({ type: 'web', url: s.url, title: '' })),
    editor_note: `Aggregated from ${sources.length} sources. AI attempts:${attempt}`
  };

  const res = await createPostInCMS(post);
  logger.info('Created post result: ' + JSON.stringify(res));
  // daily report entry
  try {
    const reportEntry = { title: post.title, slug: post.slug, sources_count: sources.length, images: imgs.length || 0 };
    logger.report(reportEntry);
  } catch (e) { logger.error('report write failed: '+e.message); }
}

if (require.main === module) {
  pipelineRun().catch(e=>{ logger.error(e.message); process.exit(1); });
}

module.exports = { pipelineRun };
