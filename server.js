'use strict';
const express = require('express');
const http    = require('http');
const https   = require('https');
const path    = require('path');
const WebSocket = require('ws');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });
const PORT   = 3000;

app.use(express.static(path.join(__dirname, 'public')));

/*  SYMBOLS  */
const SYMBOLS = {
  NSE:[
    {t:'RELIANCE.NS',n:'Reliance Industries',sym:'₹',sec:'Energy'},
    {t:'HDFCBANK.NS', n:'HDFC Bank',          sym:'₹',sec:'Banking'},
    {t:'TCS.NS',      n:'TCS',                sym:'₹',sec:'IT'},
    {t:'INFY.NS',     n:'Infosys',            sym:'₹',sec:'IT'},
    {t:'WIPRO.NS',    n:'Wipro',              sym:'₹',sec:'IT'},
    {t:'TATAMOTORS.NS',n:'Tata Motors',       sym:'₹',sec:'Auto'},
    {t:'ITC.NS',      n:'ITC Ltd',            sym:'₹',sec:'FMCG'},
    {t:'AXISBANK.NS', n:'Axis Bank',          sym:'₹',sec:'Banking'},
    {t:'BAJFINANCE.NS',n:'Bajaj Finance',     sym:'₹',sec:'NBFC'},
    {t:'MARUTI.NS',   n:'Maruti Suzuki',      sym:'₹',sec:'Auto'},
  ],
  BSE:[
    {t:'^BSESN',       n:'BSE Sensex',        sym:'₹',sec:'Index',display:'SENSEX'},
    {t:'SUNPHARMA.BO', n:'Sun Pharma',        sym:'₹',sec:'Pharma'},
    {t:'HCLTECH.BO',   n:'HCL Technologies',  sym:'₹',sec:'IT'},
    {t:'BAJAJ-AUTO.BO',n:'Bajaj Auto',        sym:'₹',sec:'Auto'},
  ],
  NASDAQ:[
    {t:'AAPL', n:'Apple Inc',      sym:'$',sec:'Tech'},
    {t:'NVDA', n:'NVIDIA',         sym:'$',sec:'Semis'},
    {t:'MSFT', n:'Microsoft',      sym:'$',sec:'Tech'},
    {t:'TSLA', n:'Tesla',          sym:'$',sec:'EV'},
    {t:'AMZN', n:'Amazon',         sym:'$',sec:'E-Com'},
    {t:'GOOGL',n:'Alphabet',       sym:'$',sec:'Tech'},
    {t:'META', n:'Meta Platforms', sym:'$',sec:'Tech'},
  ],
  NYSE:[
    {t:'JPM',n:'JPMorgan Chase',  sym:'$',sec:'Banking'},
    {t:'BAC',n:'Bank of America', sym:'$',sec:'Banking'},
    {t:'XOM',n:'Exxon Mobil',     sym:'$',sec:'Energy'},
    {t:'WMT',n:'Walmart',         sym:'$',sec:'Retail'},
    {t:'V',  n:'Visa Inc',        sym:'$',sec:'Finance'},
  ],
  Crypto:[
    {t:'BTC-USD',n:'Bitcoin',  sym:'$',sec:'L1',cg:'bitcoin'},
    {t:'ETH-USD',n:'Ethereum', sym:'$',sec:'L1',cg:'ethereum'},
    {t:'SOL-USD',n:'Solana',   sym:'$',sec:'L1',cg:'solana'},
    {t:'BNB-USD',n:'BNB',      sym:'$',sec:'Exchange',cg:'binancecoin'},
    {t:'XRP-USD',n:'XRP',      sym:'$',sec:'Payment',cg:'ripple'},
  ],
  Forex:[
    {t:'USDINR=X',n:'USD/INR',sym:'',sec:'Major',display:'USD/INR'},
    {t:'EURUSD=X',n:'EUR/USD',sym:'',sec:'Major',display:'EUR/USD'},
    {t:'GBPUSD=X',n:'GBP/USD',sym:'',sec:'Major',display:'GBP/USD'},
    {t:'USDJPY=X',n:'USD/JPY',sym:'',sec:'Major',display:'USD/JPY'},
  ],
  Commodities:[
    {t:'GC=F',n:'Gold',       sym:'$',sec:'Precious',display:'GOLD'},
    {t:'SI=F',n:'Silver',     sym:'$',sec:'Precious',display:'SILVER'},
    {t:'CL=F',n:'Crude Oil',  sym:'$',sec:'Energy',  display:'CRUDE'},
    {t:'NG=F',n:'Natural Gas',sym:'$',sec:'Energy',  display:'NATGAS'},
  ],
};

const ALL = Object.values(SYMBOLS).flat();

const BASE = {
  'RELIANCE.NS':2847,'HDFCBANK.NS':1624,'TCS.NS':3890,'INFY.NS':1456,
  'WIPRO.NS':490,'TATAMOTORS.NS':942,'ITC.NS':437,'AXISBANK.NS':1124,
  'BAJFINANCE.NS':7124,'MARUTI.NS':12340,'^BSESN':74200,'SUNPHARMA.BO':1540,
  'HCLTECH.BO':1680,'BAJAJ-AUTO.BO':8920,'AAPL':189,'NVDA':831,'MSFT':379,
  'TSLA':242,'AMZN':184,'GOOGL':162,'META':502,'JPM':198,'BAC':38,
  'XOM':117,'WMT':67,'V':275,'BTC-USD':67420,'ETH-USD':3248,'SOL-USD':148,
  'BNB-USD':413,'XRP-USD':0.584,'USDINR=X':83.24,'EURUSD=X':1.084,
  'GBPUSD=X':1.264,'USDJPY=X':153.4,'GC=F':2342,'SI=F':27.8,'CL=F':84.2,'NG=F':1.84,
};

/*  CACHE  */
let CACHE = {};
let lastFetch = null;

/*  HTTP HELPER  */
function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':'application/json',
      },
      timeout: 10000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e){ reject(e); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/*  INDICATORS  */
function rsi(prices, n=14) {
  if (prices.length < n+1) return 50;
  let g=0,l=0;
  for (let i=prices.length-n; i<prices.length; i++) {
    const d=prices[i]-prices[i-1]; d>0?g+=d:l-=d;
  }
  const ag=g/n,al=l/n;
  return al===0?100:+(100-100/(1+ag/al)).toFixed(1);
}
function macd(prices) {
  if (prices.length<26) return {v:0,s:'Neutral'};
  const ema=(d,p)=>{const k=2/(p+1);let e=d[0];for(let i=1;i<d.length;i++)e=d[i]*k+e*(1-k);return e;};
  const v=ema(prices.slice(-26),12)-ema(prices.slice(-26),26);
  return {v:+v.toFixed(2),s:v>0?'Bullish':'Bearish'};
}
function bb(prices,n=20) {
  if (prices.length<n) return {w:2};
  const sl=prices.slice(-n),m=sl.reduce((a,b)=>a+b,0)/n;
  const std=Math.sqrt(sl.reduce((s,p)=>s+(p-m)**2,0)/n);
  return {w:+((4*std/m)*100).toFixed(2)};
}
function signal(p,r,mc,hist) {
  let sc=50;
  if(r<30)sc+=20; else if(r<45)sc+=10; else if(r>70)sc-=20; else if(r>60)sc-=10;
  mc.s==='Bullish'?sc+=15:sc-=15;
  if(hist.length>=10){const a=hist.slice(-10).map(h=>h.p).reduce((a,b)=>a+b,0)/10;p>a?sc+=10:sc-=10;}
  sc=Math.max(32,Math.min(88,sc));
  return {sig:sc>=62?'BUY':sc<=44?'SELL':'HOLD',conf:sc};
}

/*  FALLBACK HISTORY  */
function fallbackHist(base,days=65) {
  const h=[]; let p=base*0.9;
  for(let i=days;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    if(d.getDay()===0||d.getDay()===6) continue;
    p=p*(1+(Math.random()-0.47)*0.022+(Math.random()-0.5)*0.006);
    p=Math.max(p,base*0.5);
    h.push({t:d.toLocaleDateString('en-IN',{month:'short',day:'numeric'}),p:+(p.toFixed(base>100?2:4))});
  }
  return h;
}

/*  BUILD STOCK OBJECT  */
function build(cfg,price,prev,high,low,vol,hist) {
  const prices=hist.map(h=>h.p);
  const r=rsi(prices),mc=macd(prices),b=bb(prices),{sig,conf}=signal(price,r,mc,hist);
  const chg=prev?+((price-prev)/prev*100).toFixed(2):0;
  const dp=price>100?2:4;
  return {
    t:cfg.t, n:cfg.n, display:cfg.display||cfg.t, sym:cfg.sym, sec:cfg.sec,
    p:+price.toFixed(dp), c:chg,
    high:high?+high.toFixed(dp):+(price*1.015).toFixed(dp),
    low:low?+low.toFixed(dp):+(price*0.985).toFixed(dp),
    vol, rsi:r, macd:mc.v, macdSig:mc.s, bb:b, signal:sig, conf,
    sup:+(price*0.97).toFixed(dp), res:+(price*1.03).toFixed(dp),
    history:hist, live:true,
  };
}

/*  FETCH ALL  */
async function fetchAll() {
  console.log(' Fetching live data...');
  let live=0;

  // Crypto via CoinGecko
  try {
    const ids=SYMBOLS.Crypto.map(s=>s.cg).join(',');
    const data=await get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`);
    if(Array.isArray(data)) {
      data.forEach(coin=>{
        const cfg=SYMBOLS.Crypto.find(s=>s.cg===coin.id); if(!cfg)return;
        const prev=coin.current_price/(1+(coin.price_change_percentage_24h||0)/100);
        const hist=fallbackHist(coin.current_price*0.85,65);
        hist[hist.length-1].p=coin.current_price;
        CACHE[cfg.t]=build(cfg,coin.current_price,prev,coin.high_24h,coin.low_24h,coin.total_volume,hist);
        live++;
      });
      console.log(`   CoinGecko: ${live} crypto`);
    }
  } catch(e){ console.log('    CoinGecko:',e.message); }

  // Stocks/Forex/Commodities via Yahoo Finance (batched)
  const stocks=ALL.filter(s=>!s.cg);
  for(let i=0;i<stocks.length;i+=6) {
    await Promise.all(stocks.slice(i,i+6).map(async cfg=>{
      try {
        const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.t)}?interval=1d&range=3mo`;
        const data=await get(url);
        const r=data?.chart?.result?.[0]; if(!r?.meta?.regularMarketPrice) throw new Error('no data');
        const m=r.meta;
        const closes=r.indicators?.quote?.[0]?.close||[];
        const hist=(r.timestamp||[]).map((ts,i)=>({
          t:new Date(ts*1000).toLocaleDateString('en-IN',{month:'short',day:'numeric'}),
          p:closes[i]?+closes[i].toFixed(m.regularMarketPrice>100?2:4):null,
        })).filter(h=>h.p);
        CACHE[cfg.t]=build(cfg,m.regularMarketPrice,m.previousClose||m.chartPreviousClose,m.regularMarketDayHigh,m.regularMarketDayLow,m.regularMarketVolume,hist.length>10?hist:fallbackHist(BASE[cfg.t]||100));
        live++;
      } catch(e){
        if(!CACHE[cfg.t]) {
          const base=BASE[cfg.t]||100;
          const p=+(base*(1+(Math.random()-0.48)*0.02)).toFixed(base>100?2:4);
          const hist=fallbackHist(base);
          CACHE[cfg.t]=build(cfg,p,base,null,null,null,hist);
          CACHE[cfg.t].live=false;
        }
      }
    }));
  }
  lastFetch=new Date().toISOString();
  console.log(`   ${live}/${ALL.length} live | ${ALL.length-live} fallback`);
}

/*  WEBSOCKET TICK  */
function tick() {
  if(!wss.clients.size) return;
  const ticks={};
  Object.values(CACHE).forEach(s=>{
    const mv=(Math.random()-0.489)*s.p*0.0012;
    s.p=+(s.p+mv).toFixed(s.p>100?2:4);
    s.c=+(s.c+(Math.random()-0.5)*0.08).toFixed(2);
    ticks[s.t]={p:s.p,c:s.c};
  });
  const msg=JSON.stringify({type:'tick',data:ticks});
  wss.clients.forEach(ws=>ws.readyState===WebSocket.OPEN&&ws.send(msg));
}

wss.on('connection',ws=>{
  if(Object.keys(CACHE).length) ws.send(JSON.stringify({type:'full',data:mktData()}));
});

/*  API  */
function mktData() {
  const r={};
  Object.entries(SYMBOLS).forEach(([k,syms])=>{ r[k]=syms.map(s=>CACHE[s.t]).filter(Boolean); });
  return r;
}

app.get('/api/markets', (_,res)=>res.json({success:true,data:mktData(),lastFetch}));
app.get('/api/quote/:sym',  (req,res)=>{
  const s=CACHE[req.params.sym];
  s?res.json({success:true,data:s}):res.status(404).json({error:'Not found'});
});
app.get('/api/health', (_,res)=>res.json({
  ok:true, symbols:Object.keys(CACHE).length,
  live:Object.values(CACHE).filter(s=>s.live).length, lastFetch, uptime:process.uptime()
}));
app.post('/api/refresh', (_,res)=>{ fetchAll(); res.json({ok:true}); });

const NEWS=[
  {title:'Sensex surges 600pts on strong FII inflows',publisher:'Economic Times',time:'09:15',sentiment:'positive'},
  {title:'RBI holds repo rate at 6.5% — accommodative stance',publisher:'Mint',time:'10:00',sentiment:'neutral'},
  {title:'TCS, Infosys rally after Q4 beats estimates',publisher:'NDTV Profit',time:'10:45',sentiment:'positive'},
  {title:'Crude jumps 2.4% — auto and aviation under pressure',publisher:'Moneycontrol',time:'11:20',sentiment:'negative'},
  {title:'Bitcoin crosses $68K on record ETF inflows',publisher:'CoinDesk',time:'12:00',sentiment:'positive'},
  {title:'NVIDIA chip backlog hits 12 months on AI demand',publisher:'Reuters',time:'12:30',sentiment:'positive'},
  {title:'Rupee at 83.1/$ on robust FII buying',publisher:'Business Standard',time:'13:00',sentiment:'neutral'},
  {title:'Tesla Q1 deliveries miss estimates by 7%',publisher:'Bloomberg',time:'13:30',sentiment:'negative'},
  {title:'India GDP upgraded to 7.8% for FY25 by IMF',publisher:'Hindu Business Line',time:'14:00',sentiment:'positive'},
  {title:'SEBI tightens F&O margin rules from June 2024',publisher:'Financial Express',time:'14:30',sentiment:'neutral'},
];
app.get('/api/news', (_,res)=>res.json({success:true,data:NEWS}));

/*  START  */
(async()=>{
  await fetchAll();
  setInterval(tick, 4000);
  setInterval(()=>fetchAll().catch(console.error), 2*60*1000);
  server.listen(PORT,()=>{
    console.log(`\n  http://localhost:${PORT}\n`);
  });
})();
