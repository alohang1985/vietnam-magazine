const { generateArticle } = require('./ai_client');

function extractText(html) {
  if (process.env.TEST_MODE === 'mock') {
    // return simple mock text
    return 'Mock article text about local attractions, markets, beaches and tips.';
  }
  const cheerio = require('cheerio');
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
  if (process.env.TEST_MODE === 'mock') {
    return {
      places: ['Beach', 'Market'],
      route: 'Start at beach -> market -> cafe',
      duration: 'half day',
      prices: ['Accommodation ~20', 'Food ~10'],
      booking: ['Book ferry in advance'],
      warnings: ['Watch for scams'],
      transport: ['Taxi', 'Motorbike'],
      opening_hours: ['09:00-18:00'],
      tips: ['Try local coffee']
    };
  }
  const system = `You are a structured-data extractor. Given a block of travel-related article text, extract the following fields into JSON: places (array of named places), route (short suggested route), duration (approx travel times), prices (list), booking (tips), warnings (list), transport (list), opening_hours (list), tips (list). Output strictly valid JSON.`;
  const user = `SourceURL: ${sourceUrl}\n\nText:\n"""\n${text.slice(0,15000)}\n"""\n\nReturn JSON.`;
  const out = await generateArticle(system, user, 800);
  const firstBrace = out.indexOf('{');
  const jsonText = out.slice(firstBrace);
  try { const j = JSON.parse(jsonText); return j; } catch (e) { return null; }
}

module.exports = { extractText, extractStructuredNotesAI }
