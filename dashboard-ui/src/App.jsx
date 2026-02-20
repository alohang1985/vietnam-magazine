import React, { useEffect, useState } from 'react';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:4000';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';
import MiniChart from './MiniChart';

function App(){
  const [priceData, setPriceData] = useState([]);
  const [trades, setTrades] = useState([]);
  const [backtest, setBacktest] = useState(null);
  const [status, setStatus] = useState({stopped:false});
  const [metrics, setMetrics] = useState({});
  const [equitySeries, setEquitySeries] = useState([]);

  const [selectedPair, setSelectedPair] = useState('BTC_KRW');
  const [pairs, setPairs] = useState(['BTC_KRW','ETH_KRW','SOL_KRW','XRP_KRW','DOT_KRW']);
  const [priceSamples, setPriceSamples] = useState({});
  const [positions, setPositions] = useState({});
  const [totals, setTotals] = useState({});

  useEffect(()=>{
    // WebSocket for real-time price updates
    let ws;
    try{
      ws = new WebSocket('ws://localhost:4001');
      ws.onmessage = (ev)=>{
        const obj = JSON.parse(ev.data);
        // handle types: price | trade
        if(obj.type === 'price'){
          if(obj.pair && obj.pair!==selectedPair){
            setPriceSamples(prev=>({ ...prev, [obj.pair]: [...(prev[obj.pair]||[]).slice(-49), {t:obj.t,c:obj.c}] }));
          } else {
            setPriceData(prev=>[...prev.slice(-199), {t: obj.t, c: obj.c}]);
          }
        } else if(obj.type === 'trade'){
          // prepend recent trade
          setTrades(prev=>[{ts: obj.ts, side: obj.side, price: obj.price, qty: obj.qty, cash: obj.cash, pair: obj.pair}, ...prev].slice(0,50));
        }
      };
      ws.onopen = ()=>console.log('WS open');
      ws.onclose = ()=>console.log('WS closed');
    }catch(e){
      console.warn('WS failed, fallback to polling');
      const fetchAll = async ()=>{
        try{
          const p = await axios.get('/api/price?n=200');
          setPriceData(p.data);
        }catch(e){console.error(e)}
      }
      fetchAll();
      const i = setInterval(fetchAll, 2000);
      return ()=>clearInterval(i);
    }
    // also poll other endpoints periodically
    const poll = async ()=>{
      try{
        const t = await axios.get('/api/trades');
        setTrades(t.data.slice(-20).reverse());
        const b = await axios.get('/api/backtest');
        setBacktest(b.data);
        const s = await axios.get('/api/status');
        setStatus(s.data);
      }catch(e){console.error(e)}
    }
    poll();
    const pInterval = setInterval(poll, 5000);

    // load metrics initially and on interval
    const loadMetrics = async ()=>{
      try{
        const m = await axios.get('/api/metrics');
        setMetrics(m.data);
      }catch(e){console.error(e)}
    }
    loadMetrics();
    const mInterval = setInterval(loadMetrics, 10000);

    // load equity series
    const loadEquity = async ()=>{
      try{
        const r = await axios.get('/api/equity');
        setEquitySeries(r.data || []);
      }catch(e){console.error(e)}
    }
    loadEquity();
    const eInterval = setInterval(loadEquity, 10000);

    // load positions
    const loadPositions = async ()=>{
      try{
        const r = await axios.get('/api/positions');
        // server now returns { positions: {...}, totals: {...} }
        setPositions(r.data.positions || {});
        setTotals(r.data.totals || {});
      }catch(e){console.error(e)}
    }
    loadPositions();
    const posInterval = setInterval(loadPositions, 1000);

    return ()=>{ if(ws) ws.close(); clearInterval(pInterval); clearInterval(mInterval); clearInterval(eInterval); clearInterval(posInterval); };
  },[selectedPair]);

  // helper to reload metrics on demand
  const loadMetrics = async ()=>{ try{ const m = await axios.get('/api/metrics'); setMetrics(m.data);}catch(e){console.error(e)} };

  // compute quick summary
  const latestPrice = priceData.length? priceData[priceData.length-1].c : null;
  // derive cash and initialCash from server totals when available
  const initialCash = totals && totals.initialCash ? totals.initialCash : (backtest? (backtest['initial_cash'] || 5000000) : 5000000);
  const cash = totals && ('cashRemaining' in totals) ? totals.cashRemaining : (trades.length? trades[0].cash : initialCash);

  // portfolio totals prefer server-provided totals when available
  let totalPosValue = totals && totals.totalPositionValue ? totals.totalPositionValue : 0;
  let totalUnreal = totals && totals.totalUnreal ? totals.totalUnreal : 0;
  if(!totalPosValue){
    const positionKeys = Object.keys(positions || {});
    totalPosValue = 0; totalUnreal = 0;
    positionKeys.forEach(k=>{
      const p = positions[k] || {};
      const qty = Number(p.qty) || 0;
      const last = Number(p.lastPrice) || 0;
      totalPosValue += qty * last;
      totalUnreal += Number(p.unrealized) || 0;
    });
  }
  const totalUnrealSign = totalUnreal >= 0;

  const chartData = {
    labels: priceData.map(p=>p.t),
    datasets: [{ label: selectedPair + ' Close', data: priceData.map(p=>p.c), borderColor: '#4caf50', tension:0.1 }]
  };

  const [resetValue, setResetValue] = useState(initialCash);
  const handleReset = async ()=>{
    try{
      const v = Number(resetValue);
      if(!v || v<0) return alert('유효한 금액을 입력하세요');
      await axios.post('/api/reset_initial_cash', { initialCash: v });
      // refresh trades and positions
      const t = await axios.get('/api/trades'); setTrades(t.data.slice(-20).reverse());
      const p = await axios.get('/api/positions'); setPositions(p.data || {});
      alert('모의잔고가 초기화되었습니다.');
    }catch(e){console.error(e); alert('실패: '+(e.response?.data?.error || e.message));}
  };

  return (
    <div className="app">
      <header><h2>JARVIS Trading Dashboard (Bithumb MVP)</h2></header>
      <main>
        <section className="top-cards">
          <div className="card small">
            <h4>페어</h4>
            <select value={selectedPair} onChange={(e)=>setSelectedPair(e.target.value)}>
              {pairs.map(p=>(<option key={p} value={p}>{p}</option>))}
            </select>
            <div style={{marginTop:6}} className="big">{latestPrice? latestPrice.toLocaleString() + ' KRW' : '불러오는중...'}</div>
          </div>
          <div className="card small">
            <h4>시작금액</h4>
            <div className="big">{Number(initialCash).toLocaleString(undefined,{maximumFractionDigits:0})} KRW</div>
          </div>
          <div className="card small">
            <h4>모의잔고</h4>
            <div className="big">{Number(cash).toLocaleString(undefined,{maximumFractionDigits:0})} KRW</div>
          </div>
          <div className="card small">
            <h4>자동매매</h4>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={async ()=>{ if(!confirm('자동매매를 시작하시겠습니까?')) return; try{ await axios.post('/api/trading/start'); const s = await axios.get('/api/status'); setStatus(s.data); alert('자동매매 시작'); }catch(e){console.error(e); alert('시작 실패')} }} style={{background:'#4caf50',color:'#fff',padding:'6px 10px',border:'none',borderRadius:4}}>Start</button>
              <button onClick={async ()=>{ if(!confirm('정말 자동매매를 정지하시겠습니까?')) return; try{ await axios.post('/api/trading/stop'); const s = await axios.get('/api/status'); setStatus(s.data); alert('자동매매 정지'); }catch(e){console.error(e); alert('정지 실패')} }} style={{background:'#e53935',color:'#fff',padding:'6px 10px',border:'none',borderRadius:4}}>Stop</button>
            </div>
          </div>
          <div className="card small">
            <h4>리셋 잔고</h4>
            <div style={{display:'flex',gap:8,alignItems:'center'}}><input id="reset-input" type="number" defaultValue={initialCash} style={{width:120}} /> <button onClick={async ()=>{const v=document.getElementById('reset-input').value; try{ const num=Number(v); if(!num||num<0) return alert('유효한 금액을 입력하세요'); await axios.post('/api/reset_initial_cash',{ initialCash: num }); const t = await axios.get('/api/trades'); setTrades(t.data.slice(-20).reverse()); const p = await axios.get('/api/positions'); setPositions(p.data || {}); alert('모의잔고가 초기화되었습니다.'); }catch(e){console.error(e); alert('실패: '+(e.response?.data?.error || e.message));}}}>리셋</button></div>
          </div>
          <div className="card small">
            <h4>총 포지션 가치</h4>
            <div className="big">{Number(Math.round(totalPosValue)).toLocaleString()} KRW</div>
          </div>
          <div className="card small">
            <h4>보유수량 합계</h4>
            <div className="big">{Object.keys(positions).reduce((acc,k)=>acc+Number(positions[k].qty||0),0).toFixed(6)} </div>
          </div>
          <div className="card small">
            <h4>총 미실현 P/L</h4>
            <div className={"big "+(totalUnrealSign? 'plus':'minus')}>{Number(totalUnreal).toLocaleString(undefined,{maximumFractionDigits:0})} KRW</div>
          </div>
        </section>

        <section className="mini-grid full-grid">
          <div className="mini-list-large">
            {pairs.map((p,i)=>(
              <div key={p} className="mini-large" onClick={()=>setSelectedPair(p)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><div className="mini-title">{p}</div><div style={{fontWeight:700}}>{(positions[p] && positions[p].lastPrice)? Number(positions[p].lastPrice).toLocaleString()+' KRW' : (priceSamples[p] && priceSamples[p].length? Number(priceSamples[p][priceSamples[p].length-1].c).toLocaleString()+' KRW' : '-')}</div></div>
                <MiniChart data={priceSamples[p]||[]} label={p} compact={false} />
              </div>
            ))}
            {/* equity chart */}
            <div className="mini-large">
              <div className="mini-title">Equity</div>
              <MiniChart data={equitySeries.map((e,i)=>({t:e.ts,c:e.equity}))} label={'Equity'} compact={false} />
            </div>
          </div>
        </section>

        <section className="panels">
  <div className="row-top" style={{display:'flex',gap:12,alignItems:'flex-start'}}>
    <div className="card trades" style={{flex:'0 0 700px',overflow:'auto'}}>
      <h3>Recent Trades (모의)</h3>
      <table>
        <thead>
          <tr>
            <th style={{width:140}}>시간</th>
            <th style={{width:60}}>동작</th>
            <th style={{width:120,textAlign:'right'}}>가격(KRW)</th>
            <th style={{width:120,textAlign:'right'}}>수량</th>
            <th style={{width:120,textAlign:'right'}}>잔고</th>
            <th>메시지</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t,i)=>(
            <tr key={i}>
              <td>{(t.ts||'').slice(0,16)}</td>
              <td style={{textAlign:'center'}}>{t.side==='buy'? '구매':'매도'}</td>
              <td style={{textAlign:'right'}}>{Number(t.price).toLocaleString()}</td>
              <td style={{textAlign:'right'}}>{Number(t.qty).toLocaleString(undefined,{maximumFractionDigits:6})}</td>
              <td style={{textAlign:'right'}}>{Number(t.cash).toLocaleString()}</td>
              <td>{t.side==='buy'? '구매했다':'팔았다'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="card positions" style={{flex:'1 1 420px',overflow:'auto'}}>
      <h3>Positions (보유현황)</h3>
      <table className="positions-table">
        <thead>
          <tr><th>페어</th><th style={{textAlign:'right'}}>수량</th><th style={{textAlign:'right'}}>평균가</th><th style={{textAlign:'right'}}>현재가</th><th style={{textAlign:'right'}}>미실현</th></tr>
        </thead>
        <tbody>
          {Object.keys(positions).length? Object.keys(positions).map((p)=>(
            <tr key={p}>
              <td>{p}</td>
              <td style={{textAlign:'right'}}>{Number(positions[p].qty).toLocaleString(undefined,{maximumFractionDigits:6})}</td>
              <td style={{textAlign:'right'}}>{positions[p].avgPrice? Number(Math.round(positions[p].avgPrice)).toLocaleString(): '-'}</td>
              <td style={{textAlign:'right'}}>{positions[p].lastPrice? Number(Math.round(positions[p].lastPrice)).toLocaleString(): '-'}</td>
              <td style={{textAlign:'right'}} className={positions[p].unrealized>=0? 'plus':'minus'}>{positions[p].unrealized? Number(Math.round(positions[p].unrealized)).toLocaleString(): 0}</td>
            </tr>
          )): <tr><td colSpan={5}>No positions</td></tr>}
        </tbody>
      </table>
    </div>
  </div>

  <div className="row-bottom" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:12}}>
    <div className="card">
      <h3>Backtest Metrics</h3>
      <div>
        <strong>Aggressive (5/20)</strong><br/>
        {metrics.aggressive? ('Final: '+metrics.aggressive.final_value.toFixed(0)+' KRW — MDD: '+metrics.aggressive.max_drawdown_pct+'% — WinRate: '+metrics.aggressive.win_rate_pct+'%') : 'No data'}
      </div>
      <div style={{marginTop:8}}><button onClick={async ()=>{await axios.get('/api/backtest');await loadMetrics();alert('리포트 리프레시 완료')}}>리프레시 리포트</button></div>
    </div>
    <div className="card">
      <h3>Quick Guide</h3>
      <ol>
        <li>데이터 수집: fetch_bithumb.py가 1분봉을 수집합니다.</li>
        <li>백테스트: Backtest 버튼으로 전략 성능을 확인하세요.</li>
        <li>페이퍼 트레이드: 자동매매 전 모의운영으로 안전성 검증.</li>
        <li>실거래: UI에서 숨김. 활성화는 Keychain + 콘솔 확인 필요.</li>
      </ol>
    </div>
    <div className="card">
      <h3>Killswitch</h3>
      <div className={status.stopped? 'alert':'ok'}>{status.stopped? 'TRIGGERED':'OK'}</div>
      <div style={{marginTop:8}}><small>누적손실 50% 시 자동중지</small></div>
    </div>
  </div>

</section>
      </main>
    </div>
  )
}

export default App;
