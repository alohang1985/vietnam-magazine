const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.resolve(__dirname, '..', 'bithumb_mvp', 'data');

// Simple CORS middleware for dev (allow localhost:3000)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const LOG_DIR = path.resolve(__dirname, '..', 'bithumb_mvp', 'logs');
const REPORT_DIR = path.resolve(__dirname, '..', 'bithumb_mvp', 'reports');
const MONITOR_DIR = path.resolve(__dirname, '..', 'bithumb_mvp', 'monitoring', 'reports');

// simple CSV parser (robust, defensive)
function parseCSV(raw){
  if(!raw || !raw.length) return [];
  const lines = raw.split(/\r?\n/).filter(l=>l && l.trim().length>0);
  if(lines.length===0) return [];
  // Force headers to expected names to avoid malformed first-line issues
  const forcedHeaders = ['timestamp','close'];
  const records = [];
  for(let i=0;i<lines.length;i++){
    const l = lines[i];
    // skip explicit header lines anywhere in the file
    if(/^\s*timestamp\s*,\s*close\s*$/i.test(l)) continue;
    const parts = l.split(',');
    if(parts.length<2) continue; // malformed
    const t = parts[0].trim();
    const c = parts[1].trim();
    // basic timestamp check
    if(!/^\d{4}-\d{2}-\d{2}T/.test(t)) continue;
    const cnum = Number(c);
    if(!isFinite(cnum)) continue;
    const obj = { timestamp: t, close: String(cnum) };
    records.push(obj);
  }
  return records;
}

app.get('/api/price', (req, res) => {
  const pair = req.query.pair || 'BTC_KRW';
  const file = path.join(DATA_DIR, `${pair}_1m.csv`);
  if (!fs.existsSync(file)) return res.json([]);
  const raw = fs.readFileSync(file, 'utf8');
  const records = parseCSV(raw);
  const N = parseInt(req.query.n || '200');
  const recent = records.slice(-N).map(r => ({ t: r.timestamp, c: Number(r.close) }));
  res.json(recent);
});

app.get('/api/trades', (req, res) => {
  // trades CSV is not the same format as price CSVs, parse manually
  const file = path.join(LOG_DIR, 'paper_trades.csv');
  if (!fs.existsSync(file)) return res.json([]);
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l=>l && l.trim().length>0);
  if(lines.length<=1) return res.json([]);
  const headers = lines[0].split(',').map(h=>h.trim());
  const out = [];
  for(let i=1;i<lines.length;i++){
    const parts = lines[i].split(',');
    if(parts.length<6) continue;
    const rec={};
    for(let j=0;j<Math.min(parts.length, headers.length); j++){
      rec[headers[j]] = parts[j];
    }
    // fallback mapping
    if(!rec.ts) rec.ts = parts[0];
    if(!rec.pair) rec.pair = parts[1];
    if(!rec.side) rec.side = parts[2];
    if(!rec.price) rec.price = parts[3];
    if(!rec.qty) rec.qty = parts[4];
    if(!rec.cash) rec.cash = parts[5];
    out.push({ ts: rec.ts, pair: rec.pair, side: rec.side, price: Number(rec.price)||0, qty: Number(rec.qty)||0, cash: Number(rec.cash)||0 });
  }
  res.json(out);
});

app.get('/api/backtest', (req, res) => {
  const file = path.join(REPORT_DIR, 'backtest_ema_report.json');
  if (!fs.existsSync(file)) return res.json({});
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json(data);
});

app.get('/api/metrics', (req, res) => {
  const file = path.join(REPORT_DIR, 'backtest_metrics.json');
  if (!fs.existsSync(file)) return res.json({});
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json(data);
});

app.get('/api/equity', (req, res) => {
  const file = path.join(REPORT_DIR, 'backtest_ema_report.json');
  if (!fs.existsSync(file)) return res.json({});
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json(data.equity_series || []);
});

app.get('/api/monitor', (req, res) => {
  // return list of recent monitor reports (names)
  if (!fs.existsSync(MONITOR_DIR)) return res.json({reports: []});
  const files = fs.readdirSync(MONITOR_DIR).filter(f=>f.match(/last_run.txt|processes|top_cpu_mem|data_files/)).sort().reverse().slice(0,10);
  const out = files.map(f=>({name:f, path:`/monitor/${f}`}));
  res.json({reports: out});
});

app.get('/monitor/:file', (req, res) => {
  const f = req.params.file;
  const p = path.join(MONITOR_DIR, f);
  if (!fs.existsSync(p)) return res.status(404).send('not found');
  res.sendFile(p);
});

// expose and set current trading style for UI
let currentStyle = process.env.TRADING_STYLE || 'balanced';
app.get('/api/status', (req, res) => {
  const stopped = fs.existsSync(path.join(__dirname, '..', 'bithumb_mvp', 'STOPPED'));
  res.json({ stopped, style: currentStyle });
});

app.post('/api/style', express.json(), (req, res) => {
  const s = req.body && req.body.style;
  if(!s) return res.status(400).json({ error: 'missing style' });
  currentStyle = s;
  // note: this doesn't restart paper_trader process; it's for UI/state. For paper_trader, set env and restart if wanted.
  res.json({ ok: true, style: currentStyle });
});

// WebSocket server
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 4001 });
console.log('WebSocket server listening on 4001');

// positions cache
let positionsCache = {}; // { pair: { qty, avgPrice, unrealized, unrealizedPct } }
const PRICE_PAIRS = ['BTC_KRW','ETH_KRW','SOL_KRW','XRP_KRW','DOT_KRW'];

function updatePositionsCache(){
  // read trades log and compute positions + avg price
  const file = path.join(LOG_DIR, 'paper_trades.csv');
  if(!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  // parse CSV trades file (expected header: ts,pair,side,price,qty,cash[,avg_entry])
  const lines = raw.split(/\r?\n/).filter(l=>l && l.trim().length>0);
  if(lines.length<=1) return; // no data
  const headers = lines[0].split(',').map(h=>h.trim());
  const records = [];
  for(let i=1;i<lines.length;i++){
    const parts = lines[i].split(',');
    if(parts.length<6) continue;
    const rec = {};
    for(let j=0;j<Math.min(parts.length, headers.length); j++){
      rec[headers[j]] = parts[j];
    }
    // if header count < cols, map by position
    if(!rec.pair) rec.pair = parts[1] || '';
    if(!rec.side) rec.side = parts[2] || '';
    if(!rec.price) rec.price = parts[3] || '0';
    if(!rec.qty) rec.qty = parts[4] || '0';
    if(!rec.cash) rec.cash = parts[5] || '0';
    records.push(rec);
  }
  const pos = {};
  // we'll also compute cash flow to determine cashRemaining
  let netCashFlow = 0; // positive means cash spent (buys), negative means cash gained (sells)
  records.forEach(r=>{
    const p = (r.pair || 'BTC_KRW').toUpperCase();
    if(!pos[p]) pos[p]={qty:0,cost:0};
    const side = (r.side||'').toLowerCase();
    const price = Number(r.price)||0;
    const qty = Number(r.qty)||0;
    if(side==='buy'){
      pos[p].cost += price*qty;
      pos[p].qty += qty;
      netCashFlow += price*qty; // cash spent
    } else if(side==='sell'){
      // handle sell reducing qty and cost proportionally
      const prevQty = pos[p].qty;
      if(prevQty<=0){
        pos[p].qty = Math.max(0, pos[p].qty - qty);
        pos[p].cost = Math.max(0, pos[p].cost - price*qty);
      } else {
        // reduce cost proportionally to remaining qty
        const unitCost = prevQty>0 ? pos[p].cost / prevQty : 0;
        const reduceCost = unitCost * Math.min(qty, prevQty);
        pos[p].qty = Math.max(0, pos[p].qty - qty);
        pos[p].cost = Math.max(0, pos[p].cost - reduceCost);
      }
      netCashFlow -= price*qty; // cash gained reduces net spent
    }
  });
  // determine initial cash: try backtest report, fallback to 20000000
  let initialCash = 20000000;
  try{
    const reportFile = path.join(REPORT_DIR, 'backtest_ema_report.json');
    if(fs.existsSync(reportFile)){
      const rep = JSON.parse(fs.readFileSync(reportFile,'utf8'));
      if(rep && rep.initial_cash) initialCash = Number(rep.initial_cash) || initialCash;
    }
  }catch(e){ console.warn('could not read backtest report for initial cash', e && e.message); }
  const cashRemaining = Math.max(0, initialCash - netCashFlow);

  // compute unrealized using latest price and also totals
  let totalPositionValue = 0;
  let totalUnrealized = 0;
  PRICE_PAIRS.forEach(pair=>{
    const q = pos[pair]?.qty || 0;
    const cost = pos[pair]?.cost || 0;
    const avg = q? cost/q : 0;
    // read latest price
    const dataFile = path.join(DATA_DIR, `${pair}_1m.csv`);
    let lastPrice = null;
    if(fs.existsSync(dataFile)){
      const raw2 = fs.readFileSync(dataFile,'utf8');
      const recs2 = parseCSV(raw2);
      if(recs2.length) lastPrice = Number(recs2[recs2.length-1].close);
    }
    const unreal = lastPrice? (lastPrice - avg)*q : 0;
    const unrealPct = avg? ((lastPrice - avg)/avg*100) : 0;
    positionsCache[pair] = { qty: q, avgPrice: avg, lastPrice: lastPrice, unrealized: unreal, unrealizedPct: Number(unrealPct.toFixed(2)) };
    totalPositionValue += (lastPrice? lastPrice*q : 0);
    totalUnrealized += unreal;
  });
  // attach summary totals into positionsCache under a reserved key
  positionsCache.__totals = {
    initialCash: initialCash,
    cashRemaining: Math.round(cashRemaining),
    totalPositionValue: Math.round(totalPositionValue),
    totalUnrealized: Math.round(totalUnrealized)
  };
}
setInterval(updatePositionsCache, 1000);

function broadcastPrice(){
  // broadcast latest for each pair file if exists
  const pairs = PRICE_PAIRS;
  pairs.forEach(pair => {
    try{
      const file = path.join(DATA_DIR, `${pair}_1m.csv`);
      if (!fs.existsSync(file)) return;
      const raw = fs.readFileSync(file, 'utf8');
      const records = parseCSV(raw);
      if (!records.length) return;
      const last = records[records.length-1];
      // DEBUG: log parsed last
      console.log(`DEBUG parsed last for ${pair}:`, last);
      const cVal = Number(last && last.close);
      // defend against invalid/malformed numeric values (NaN -> null in JSON)
      if (!isFinite(cVal)){
        console.warn(`broadcastPrice: skipping ${pair} due to invalid close value: ${last && last.close}`);
        return;
      }
      const payload = JSON.stringify({ type: 'price', pair: pair, t: last.timestamp, c: cVal });
      wss.clients.forEach(client=>{ if (client.readyState===1) client.send(payload); });
    }catch(e){
      // don't let one pair failure stop broadcasting others
      console.error('broadcastPrice error for', pair, e && e.stack ? e.stack : String(e));
    }
  });
}
setInterval(broadcastPrice, 1000);

// broadcast new trades when paper_trades.csv is updated
let lastTradeCount = 0;
function broadcastNewTrades(){
  const file = path.join(LOG_DIR, 'paper_trades.csv');
  if(!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  const records = parseCSV(raw);
  if(records.length > lastTradeCount){
    const newRecords = records.slice(lastTradeCount);
    newRecords.forEach(r=>{
      const payload = JSON.stringify({ type:'trade', ts: r.ts, pair: r.pair || 'BTC_KRW', side: r.side, price: Number(r.price), qty: Number(r.qty), cash: Number(r.cash) });
      wss.clients.forEach(client=>{ if(client.readyState===1) client.send(payload); });
    });
    lastTradeCount = records.length;
  }
}
setInterval(broadcastNewTrades, 1000);

// positions API
app.post('/api/reset_initial_cash', express.json(), (req, res)=>{
  const v = req.body && Number(req.body.initialCash);
  if(!v || isNaN(v) || v<0) return res.status(400).json({ error: 'invalid initialCash' });
  const file = path.join(LOG_DIR, 'paper_trades.csv');
  try{
    // backup existing trades file
    if(fs.existsSync(file)){
      const bakName = `paper_trades.${new Date().toISOString().replace(/[:.]/g,'')}.bak`;
      const bakPath = path.join(LOG_DIR, bakName);
      fs.copyFileSync(file, bakPath);
      // write reset history (CSV): ts,initialCash,backup
      const hist = path.join(LOG_DIR, 'reset_history.csv');
      const histRow = `${new Date().toISOString()},${v},${bakName}\n`;
      fs.appendFileSync(hist, histRow);
    }
    // reinitialize trades file with header only
    const header = 'ts,pair,side,price,qty,cash\n';
    fs.writeFileSync(file, header, 'utf8');
  }catch(e){
    return res.status(500).json({ error: 'backup/reset failed', detail: String(e) });
  }
  // Broadcast immediate trade update to WebSocket clients (reset event)
  const ts = new Date().toISOString();
  const payload = JSON.stringify({ type:'trade', ts, pair: 'RESET', side: 'reset', price: 0, qty: 0, cash: v });
  wss.clients.forEach(client=>{ if(client.readyState===1) client.send(payload); });
  // force update positions cache quickly (will read empty trades => zero positions)
  updatePositionsCache();
  return res.json({ ok:true, initialCash: v });
});

app.post('/api/trading/start', express.json(), (req, res)=>{
  // remove STOPPED file if exists
  try{
    const stopFile = path.join(__dirname, '..', 'bithumb_mvp', 'STOPPED');
    if(fs.existsSync(stopFile)) fs.unlinkSync(stopFile);
    // broadcast status
    const payload = JSON.stringify({ type: 'status', stopped: false });
    wss.clients.forEach(client=>{ if(client.readyState===1) client.send(payload); });
    return res.json({ ok:true, stopped: false });
  }catch(e){
    return res.status(500).json({ error: 'failed to start', detail: String(e) });
  }
});

app.post('/api/trading/stop', express.json(), (req, res)=>{
  try{
    const stopFile = path.join(__dirname, '..', 'bithumb_mvp', 'STOPPED');
    fs.writeFileSync(stopFile, 'stopped');
    const payload = JSON.stringify({ type: 'status', stopped: true });
    wss.clients.forEach(client=>{ if(client.readyState===1) client.send(payload); });
    return res.json({ ok:true, stopped: true });
  }catch(e){
    return res.status(500).json({ error: 'failed to stop', detail: String(e) });
  }
});

// set initial cash (update backtest report initial_cash)
app.post('/api/set_initial_cash', express.json(), (req, res)=>{
  const v = req.body && Number(req.body.initialCash);
  if(!v || isNaN(v) || v<0) return res.status(400).json({ error: 'invalid initialCash' });
  try{
    const reportFile = path.join(REPORT_DIR, 'backtest_ema_report.json');
    let report = {};
    if(fs.existsSync(reportFile)){
      report = JSON.parse(fs.readFileSync(reportFile,'utf8'));
    }
    report.initial_cash = v;
    fs.writeFileSync(reportFile, JSON.stringify(report,null,2),'utf8');
    // also append a RESET trade so UI cash reflects immediately
    const file = path.join(LOG_DIR, 'paper_trades.csv');
    const ts = new Date().toISOString();
    const row = `${ts},RESET,reset,0,0,${v}\n`;
    fs.appendFileSync(file, row);
    // history
    const hist = path.join(LOG_DIR, 'reset_history.csv');
    const histRow = `${new Date().toISOString()},${v},set_initial\n`;
    fs.appendFileSync(hist, histRow);
    // broadcast
    const payload = JSON.stringify({ type:'trade', ts, pair:'RESET', side:'reset', price:0, qty:0, cash: v });
    wss.clients.forEach(client=>{ if(client.readyState===1) client.send(payload); });
    updatePositionsCache();
    return res.json({ ok:true, initialCash: v });
  }catch(e){
    return res.status(500).json({ error: 'failed', detail: String(e) });
  }
});

app.get('/api/positions', (req, res)=>{
  // return positions plus computed totals in a stable shape
  const out = { positions: {}, totals: {} };
  Object.keys(positionsCache).forEach(k=>{
    if(k==='__totals') return;
    out.positions[k] = positionsCache[k];
  });
  out.totals = positionsCache.__totals || {};
  res.json(out);
});

app.listen(PORT, () => console.log(`Dashboard API listening on ${PORT}`));
