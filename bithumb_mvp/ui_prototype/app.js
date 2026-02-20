// Bithumb REST snapshot + WebSocket integration for prototype
const PAIR = 'BTC_KRW';
const REST_SNAPSHOT_URL = `https://api.bithumb.com/public/orderbook/${PAIR}`;
const WS_URL = 'wss://pubwss.bithumb.com/pub/ws';
let orderbook = {asks: [], bids: []};
let trades = [];
let ws;
let reconnectDelay = 1000;
const RENDER_THROTTLE_MS = 150;
let lastRender = 0;

// Lightweight charts setup
let chart, candleSeries, volumeSeries, lastTimeSec;
let __pendingPrice = null;
function createFallbackCanvas(container){
  container.innerHTML = '<canvas id="chartCanvas" width="' + container.clientWidth + '" height="320"></canvas>';
  const canvas = container.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const buffer = [];
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(buffer.length<2) return;
    const max = Math.max(...buffer);
    const min = Math.min(...buffer);
    const range = max - min || 1;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
    buffer.forEach((v,i)=>{
      const x = (i/(buffer.length-1))*canvas.width;
      const y = canvas.height - ((v-min)/range)*canvas.height;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }
  return {
    push(v){ buffer.push(v); if(buffer.length>200) buffer.shift(); },
    draw(){ draw(); },
    resize(){ canvas.width = container.clientWidth; canvas.height = 320; draw(); }
  };
}

function initChart() {
  const container = document.getElementById('chart');
  if (typeof LightweightCharts !== 'undefined'){
    try{
      chart = LightweightCharts.createChart(container, {layout:{background: {color: 'transparent'},textColor: '#e6eef6'},width: container.clientWidth,height: 320,rightPriceScale:{scaleMargins:{top:0.2,bottom:0.2}},timeScale:{timeVisible:true,secondsVisible:false}});
      // use line + histogram for compatibility
      if (chart && typeof chart.addLineSeries === 'function'){
        const lineSeries = chart.addLineSeries({color: '#fff', lineWidth: 2});
        const histSeries = chart.addHistogramSeries({color: '#2b6b4a', priceFormat:{type:'volume'}, scaleMargins:{top:0.8,bottom:0}});
        window.__lineSeries = lineSeries;
        window.__histSeries = histSeries;
        window.__chartFallback = null;
      } else {
        console.warn('LightweightCharts present but API missing, using fallback canvas');
        window.__chartFallback = createFallbackCanvas(container);
      }
    }catch(e){
      console.warn('createChart failed, using fallback canvas', e);
      window.__chartFallback = createFallbackCanvas(container);
    }
  } else {
    console.warn('LightweightCharts not loaded, using fallback canvas');
    window.__chartFallback = createFallbackCanvas(container);
  }
  window.addEventListener('resize', ()=>{
    if (window.__chartFallback && window.__chartFallback.resize) window.__chartFallback.resize();
    else if (chart) chart.applyOptions({width: container.clientWidth});
  });
  // flush pending price if any
  if (__pendingPrice !== null) {
    updateChartWithPrice(__pendingPrice);
    __pendingPrice = null;
  }
}

// modify updateChartWithPrice to write to fallback if used
function updateChartWithPrice(price) {
  try {
    const v = Number(price);
    if (isNaN(v)) return;
    // if using fallback
    if (window.__chartFallback){
      window.__chartFallback.push(v);
      window.__chartFallback.draw();
      return;
    }
    // if series not ready yet, buffer the last price
    if (!window.__lineSeries || !window.__histSeries) {
      __pendingPrice = v;
      return;
    }
    const t = Math.floor(Date.now()/1000);
    lastTimeSec = t;
    // update line if available
    if (window.__lineSeries && typeof window.__lineSeries.update === 'function') {
      window.__lineSeries.update({time: t, value: v});
    } else {
      __pendingPrice = v; return;
    }
    // update histogram with synthetic volume
    const vol = Math.round(Math.random()*1000);
    if (window.__histSeries && typeof window.__histSeries.update === 'function') {
      window.__histSeries.update({time: t, value: vol, color: '#2b6b4a'});
    }
  } catch (e) { console.warn('chart update err', e); }
}

function updateChartWithPrice(price) {
  try {
    const v = Number(price);
    if (isNaN(v)) return;
    // if series not ready yet, buffer the last price
    if (!window.__lineSeries || !window.__histSeries) {
      __pendingPrice = v;
      return;
    }
    const t = Math.floor(Date.now()/1000);
    lastTimeSec = t;
    // update line if available
    if (window.__lineSeries && typeof window.__lineSeries.update === 'function') {
      window.__lineSeries.update({time: t, value: v});
    } else {
      __pendingPrice = v; return;
    }
    // update histogram with synthetic volume
    const vol = Math.round(Math.random()*1000);
    if (window.__histSeries && typeof window.__histSeries.update === 'function') {
      window.__histSeries.update({time: t, value: vol, color: '#2b6b4a'});
    }
  } catch (e) { console.warn('chart update err', e); }
}

window.addEventListener('load', ()=>{
  if (typeof LightweightCharts === 'undefined'){
    console.warn('LightweightCharts not available');
    setStatus('차트 라이브러리 로드 실패');
  } else if (!document.getElementById('chart')){
    console.warn('Chart container missing');
    setStatus('차트 컨테이너 없음');
  } else {
    try{ initChart(); setStatus('차트 초기화 완료'); }catch(e){ console.warn('initChart failed', e); setStatus('차트 초기화 실패'); }
  }
});

function renderOrderbook() {
  const asksEl = document.getElementById('asks');
  const bidsEl = document.getElementById('bids');
  asksEl.innerHTML = '';
  bidsEl.innerHTML = '';
  // show top 10
  const topAsks = orderbook.asks.slice(0, 10);
  const topBids = orderbook.bids.slice(0, 10);
  topAsks.forEach(row => {
    const r = document.createElement('div'); r.className='row';
    r.innerHTML = `<div>${row[0]}</div><div>${row[1]}</div>`;
    asksEl.appendChild(r);
  });
  topBids.forEach(row => {
    const r = document.createElement('div'); r.className='row';
    r.innerHTML = `<div>${row[0]}</div><div>${row[1]}</div>`;
    bidsEl.appendChild(r);
  });
}

function renderTrades() {
  const t = document.getElementById('trades');
  t.innerHTML = '';
  trades.slice(-30).reverse().forEach(tr => {
    const r = document.createElement('div'); r.className='row-small';
    r.innerHTML = `<div>${new Date(tr.timestamp).toLocaleTimeString()}</div><div style="color:${tr.side==='buy'? '#00d27a':'#ff6b7a'}">${tr.side.toUpperCase()}</div><div>${tr.price}</div>`;
    t.appendChild(r);
  });
}

function renderTicker(last) {
  document.getElementById('last').innerText = last || '-';
  if (last && !isNaN(Number(last))) updateChartWithPrice(Number(last));
}

function scheduleRender() {
  const now = Date.now();
  if (now - lastRender > RENDER_THROTTLE_MS) {
    renderOrderbook(); renderTrades(); lastRender = now;
  } else {
    setTimeout(() => { renderOrderbook(); renderTrades(); lastRender = Date.now(); }, RENDER_THROTTLE_MS);
  }
}

async function fetchSnapshot() {
  try {
    const res = await fetch(REST_SNAPSHOT_URL);
    if (!res.ok) throw new Error('snapshot HTTP ' + res.status);
    const j = await res.json();
    if (j.status && j.status !== '0000') throw new Error('REST snapshot error');
    const data = j.data || j;
    // if orderbook not present, fallback to ticker
    if (!data.asks && !data.bids) {
      console.log('Orderbook snapshot missing, falling back to ticker');
      const tickRes = await fetch(`https://api.bithumb.com/public/ticker/${PAIR}`);
      const tickJ = await tickRes.json();
      const last = tickJ && tickJ.data && tickJ.data.closing_price;
      if (last) renderTicker(last);
      return;
    }
    orderbook.asks = (data.asks || []).map(a => [a.price || a[0], a.quantity || a[1]]).sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]));
    orderbook.bids = (data.bids || []).map(b => [b.price || b[0], b.quantity || b[1]]).sort((a,b)=>parseFloat(b[0]) - parseFloat(a[0]));
    renderTicker((data.timestamp && data.bids && data.bids[0] && data.bids[0][0]) ? data.bids[0][0] : (orderbook.bids[0] && orderbook.bids[0][0]));
    scheduleRender();
    console.log('REST snapshot loaded');
  } catch (e) {
    console.warn('Snapshot fetch failed', e);
    // fallback to ticker
    try {
      const tickRes = await fetch(`https://api.bithumb.com/public/ticker/${PAIR}`);
      const tickJ = await tickRes.json();
      const last = tickJ && tickJ.data && tickJ.data.closing_price;
      if (last) renderTicker(last);
    } catch (e2) { console.warn('ticker fallback failed', e2); }
  }
}

function connectWS() {
  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    console.warn('WS construct failed', e); scheduleReconnect(); return;
  }
  ws.onopen = () => { console.log('WS open'); setStatus('WS open'); reconnectDelay = 1000; // subscribe
    // Bithumb subscribe message example
    try{
      const sub = {"type":"orderbookdepth","symbols":[PAIR],"tickTypes":["1M"]};
      ws.send(JSON.stringify(sub));
      console.log('WS subscribe sent', sub);
    }catch(e){console.warn('WS subscribe failed', e)}
  };
  ws.onmessage = (evt) => {
    console.log('WS message raw', evt.data);
    try {
      const msg = JSON.parse(evt.data);
      // handle different message shapes; Bithumb may wrap in {type, content}
      if (msg.type === 'orderbookdepth' || msg.type === 'orderbook') {
        const content = msg.content || msg.data || msg;
        // content example: {symbol:'BTC_KRW', asks:[[price,qty],...], bids:[[...]]}
        if (content.asks) orderbook.asks = content.asks.slice().sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]));
        if (content.bids) orderbook.bids = content.bids.slice().sort((a,b)=>parseFloat(b[0]) - parseFloat(a[0]));
        // update visible last price from top of book
        const topBid = orderbook.bids && orderbook.bids[0] && parseFloat(orderbook.bids[0][0]);
        const topAsk = orderbook.asks && orderbook.asks[0] && parseFloat(orderbook.asks[0][0]);
        const lastPrice = topBid || topAsk || null;
        if (lastPrice) renderTicker(lastPrice);
        scheduleRender();
      } else if (msg.type === 'trade' || msg.type === 'transaction' || msg.type === 'tickers') {
        const content = msg.content || msg.data || msg;
        if (Array.isArray(content)) content.forEach(c=>appendTradeFromMsg(c));
        else appendTradeFromMsg(content);
      } else if (msg.content && msg.content.type==='orderbook') {
        const c = msg.content;
        if (c.asks) orderbook.asks = c.asks.slice().sort((a,b)=>parseFloat(a[0]) - parseFloat(b[0]));
        if (c.bids) orderbook.bids = c.bids.slice().sort((a,b)=>parseFloat(b[0]) - parseFloat(a[0]));
        scheduleRender();
      }
    } catch (e) { console.warn('WS parse error', e); }
  };
  ws.onclose = (e) => { console.log('WS closed', e); scheduleReconnect(); };
  ws.onerror = (e) => { console.warn('WS error', e); ws.close(); };
}

function scheduleReconnect() { setTimeout(()=>{ reconnectDelay = Math.min(60000, reconnectDelay*1.5); connectWS(); }, reconnectDelay); }

function setStatus(msg){ try{ const s=document.getElementById('status'); if(s) s.innerText = 'Status: '+msg;}catch(e){} }


function appendTradeFromMsg(m) {
  // normalize possible shapes
  try {
    let price = m.price || m[2] || m[0];
    let qty = m.quantity || m[3] || m[1] || 0;
    let side = (m.side||m[4]||'').toString().toLowerCase();
    if (!price) return;
    const t = {price: price, qty: qty, side: (side.includes('ask')||side.includes('sell'))? 'sell':'buy', timestamp: Date.now()};
    trades.push(t);
    // limit size
    if (trades.length>500) trades = trades.slice(-500);
    scheduleRender();
  } catch (e) { console.warn('trade parse err', e); }
}

// quick buttons
document.addEventListener('click',e=>{
  if(e.target.matches('.quick button')){
    const pct=e.target.dataset.pct;const cash=1000000;const price=document.getElementById('price').value||100000000;document.getElementById('qty').value=Math.floor((cash*parseFloat(pct))/price*10000)/10000;
  }
  if(e.target.id==='buy'){alert('매수 시뮬레이션: 주문 전송('+document.getElementById('price').value+','+document.getElementById('qty').value+')')}
  if(e.target.id==='sell'){alert('매도 시뮬레이션: 주문 전송('+document.getElementById('price').value+','+document.getElementById('qty').value+')')}
});

// init
(async function(){
  await fetchSnapshot();
  connectWS();
  // fallback: if no data, populate with dummy
  if (!orderbook.asks.length && !orderbook.bids.length) {
    const asks=document.getElementById('asks');const bids=document.getElementById('bids');const base=60000000;for(let i=10;i>=1;i--){const r=document.createElement('div');r.className='row';const p=(base+(Math.random()-0.5)*(i*10)).toFixed(0);r.innerHTML=`<div>${p}</div><div>${(Math.random()*0.5).toFixed(4)}</div>`;asks.appendChild(r)} for(let i=1;i<=10;i++){const r=document.createElement('div');r.className='row';const p=(base-(Math.random()-0.5)*(i*10)).toFixed(0);r.innerHTML=`<div>${p}</div><div>${(Math.random()*0.5).toFixed(4)}</div>`;bids.appendChild(r)}
  }
})();
