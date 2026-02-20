const fetch = require('node-fetch');
module.exports = async function pingSitemap(url){
  if (process.env.TEST_MODE === 'mock'){
    console.log('sitemap ping skipped (mock)');
    return { ok:true };
  }
  try{
    // Google
    await fetch(`http://www.google.com/ping?sitemap=${encodeURIComponent(url)}`);
    await fetch(`http://www.bing.com/ping?sitemap=${encodeURIComponent(url)}`);
    return { ok:true };
  }catch(e){ return { ok:false, err:e.message } }
}
