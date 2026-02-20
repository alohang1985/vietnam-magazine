const cheerio = require('cheerio');
const { generateArticle } = require('./ai_client');

function extractText(html) {
  const $ = cheerio.load(html);
  $('script,style,noscript').remove();
  let candidates = [];
  ['article','main','#content','body'].forEach(sel=>{
    $(sel).each((i,el)=>{ candidates.push($(el).text()); });
  });
  if (candidates.length === 0) candidates.push($('body').text());
  const text = candidates.join('\n').replace(/\s{2,}/g,' ').trim();
  return text;
}

async function extractStructuredNotesAI(text, sourceUrl) {
  const system = `You are a structured-data extractor. Given a block of travel-related article text, extract the following fields into JSON: places (array of named places), route (short suggested route), duration (approx travel times), prices (list), booking (tips), warnings (list), transport (list), opening_hours (list), tips (list). Output strictly valid JSON.`;
  const user = `SourceURL: ${sourceUrl}\n\nText:\n"""\n${text.slice(0,15000)}\n"""\n\nReturn JSON.`;
  const out = await generateArticle(system, user, 800);
  // parse JSON
  const firstBrace = out.indexOf('{');
  const jsonText = out.slice(firstBrace);
  try { const j = JSON.parse(jsonText); return j; } catch (e) { return null; }
}

module.exports = { extractText, extractStructuredNotesAI }
