const fetch = require('node-fetch');
module.exports = async function httpFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  return { status: res.status, headers: res.headers.raw(), text };
}
