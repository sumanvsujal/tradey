# Tradey — Paper Trading Simulator and Market Education Platform

## Full-Stack Real-Time Trading Environment

---

## Overview

Tradey is a self-contained, local-first paper trading platform that combines live market data, rule-based technical signal generation, and a structured trading curriculum into a single runnable application.

Instead of requiring a broker account, KYC, or any registration, the system gives anyone access to:

- Live prices across 7 market categories
- Real-time technical indicators computed from historical data
- A fully functional simulated trading environment
- A progression-based learning system tied to actual trading actions

The goal is to eliminate the barrier between curiosity and hands-on market experience — zero financial risk, zero registration wall, zero setup complexity beyond installing Node.js.

---

## Core Idea

Most trading education tools separate learning from doing.

Brokerage paper trading modes require a real account. Analytics platforms do not let you trade. Educational apps do not show live prices.

Tradey fixes this by putting all three in one place:

- Live data from Yahoo Finance and CoinGecko feeds real prices
- Deterministic technical analysis computes signals on that live data
- A paper trading engine executes orders against those real prices
- A structured curriculum teaches the concepts behind every indicator the platform uses

This means a user can read about RSI in the Learn section, see RSI computed on a live chart two clicks away, and place a trade based on that RSI signal — all within the same session.

---

## Key Features

- Live price ingestion from Yahoo Finance (stocks, forex, commodities) and CoinGecko (crypto)
- WebSocket price ticks pushed to the browser every 4 seconds
- RSI(14), MACD(12/26), and Bollinger Band width computed per symbol from 65-day historical series
- Multi-factor signal engine producing BUY / HOLD / SELL with a 0-100 confidence score
- Paper trading wallet with simulated brokerage (0.03%) and STT (0.1%) on every order
- Weighted-average position tracking across multiple buys of the same symbol
- Virtual funds deposit system with preset and custom amounts
- 13 pages covering trading, portfolio management, signals, predictions, news, and education
- 9-lesson curriculum from stock basics through Elliott Wave theory
- Quiz bank, daily challenges, achievement system, and XP progression
- Graceful fallback to random-walk simulated data when upstream APIs are unavailable

---

## System Architecture

```
Yahoo Finance API (unofficial chart endpoint)
CoinGecko API (free tier, /coins/markets)
        |
        v
  fetchAll() — runs on startup, repeats every 2 minutes
        |
        v
  Per-symbol: parse OHLCV, extract 65-day close series
        |
        v
  rsi() / macd() / bb() — pure functions, no side effects
        |
        v
  signal() — scoring engine, outputs BUY/HOLD/SELL + conf
        |
        v
  build() — assembles complete stock object into CACHE{}
        |
     /api/markets          tick() every 4s
        |                       |
        v                       v
  Browser receives          WebSocket broadcast
  full dataset on load      {ticker: {p, c}} to all clients
        |                       |
        v                       v
  D{} and MD{} populated    D[ticker].p updated in memory
        |
        v
  Chart.js renders price history
  Dashboard, Markets, Trade panels update
  P&L recomputed live against current prices
```

---

## Signal Generation

All signals are deterministic and rule-based. There is no machine learning model.

The scoring engine starts at a neutral score of 50 and adjusts based on three inputs:

| Condition | Adjustment |
|---|---|
| RSI below 30 (oversold) | +20 |
| RSI below 45 | +10 |
| RSI above 70 (overbought) | -20 |
| RSI above 60 | -10 |
| MACD bullish crossover | +15 |
| MACD bearish crossover | -15 |
| Price above 10-day average | +10 |
| Price below 10-day average | -10 |

Score is clamped to 32-88. Above 62 is BUY, below 44 is SELL, between is HOLD. The score itself is exposed as the confidence percentage in the UI.

---

## What the AI Layer Is and Is Not

The platform uses the term AI for branding. The honest breakdown:

**Signal generation** — rule-based scoring formula as described above. Transparent and inspectable.

**7-Day Predictor** — current price multiplied by a small directional factor derived from the existing BUY/SELL signal. It is illustrative, not a trained forecast model. There is no time-series model behind it.

**AI Chat Assistant** — a 12-entry keyword-matched knowledge base covering RSI, MACD, stop loss, Bollinger Bands, Fibonacci, moving averages, candlesticks, support/resistance, and risk management. Additionally performs a substring match on company names and tickers to echo live price and signal data. No LLM call, no context window.

---

## Project Structure

```
tradey/
├── server.js              backend — data ingestion, WebSocket, API routes
├── public/
│   └── index.html         entire frontend — CSS, HTML, JS in one file
├── node_modules/          bundled, no npm install required
├── package.json
├── package-lock.json
├── start.bat              Windows one-click launcher
├── start.sh               Mac/Linux one-click launcher
└── README.md
```

---

## Setup

### Requirement

Node.js from https://nodejs.org — one-time installation, any LTS version.

`node_modules` is included in the project zip. No `npm install` needed.

### Clone or extract

```
unzip tradey.zip
cd tradey
```

---

## Run the Project

### Windows

```
start.bat
```

Double-click or run from terminal. Opens the browser automatically.

### Mac / Linux

```
chmod +x start.sh
./start.sh
```

### Manual

```
node server.js
```

Then open `http://localhost:3000` in any browser.

---

## API Endpoints

### Health Check

```
GET /api/health
```

Returns symbol count, live vs fallback breakdown, last fetch timestamp, and server uptime.

---

### All Market Data

```
GET /api/markets
```

Returns the full cached dataset — all 39 symbols organized by market, each with price, change, RSI, MACD, Bollinger width, signal, confidence, support, resistance, and 65-day price history.

---

### Single Quote

```
GET /api/quote/:symbol
```

Example: `/api/quote/RELIANCE.NS`

---

### News Feed

```
GET /api/news
```

Returns 10 market headlines with sentiment tags (positive / neutral / negative).

---

### Force Refresh

```
POST /api/refresh
```

Triggers an immediate re-fetch from Yahoo Finance and CoinGecko outside the regular 2-minute cycle.

---

## Market Coverage

39 instruments across 7 categories:

| Market | Count | Examples |
|---|---|---|
| NSE | 10 | Reliance, HDFC Bank, TCS, Infosys, Bajaj Finance |
| BSE | 4 | Sensex index, Sun Pharma, HCL Tech, Bajaj Auto |
| NASDAQ | 7 | Apple, NVIDIA, Microsoft, Tesla, Meta |
| NYSE | 5 | JPMorgan, Bank of America, Exxon, Walmart, Visa |
| Crypto | 5 | Bitcoin, Ethereum, Solana, BNB, XRP |
| Forex | 4 | USD/INR, EUR/USD, GBP/USD, USD/JPY |
| Commodities | 4 | Gold, Silver, Crude Oil, Natural Gas |

---

## Application Pages

| Page | Function |
|---|---|
| Dashboard | Live chart, RSI/MACD/BB indicators, AI signal, watchlist, chat assistant |
| Markets | Full table of all symbols in selected market with all indicators |
| Trade | Order placement, order book, brokerage calculator, pre-trade signal review |
| Portfolio | Holdings with live P&L, trade history, deposit history |
| AI Insights | Ranked BUY/SELL signals across all 39 symbols, sector heatmap, sentiment ratio |
| Predictor | Per-symbol directional forecast, high-confidence scanner |
| News Feed | 10 headlines with sentiment tags and analysis panel |
| Learn | 9-lesson curriculum, beginner to expert |
| Quiz | 8-question knowledge assessment, XP rewards |
| Challenges | 5 daily goals, 6 achievement badges |
| Leaderboard | Session-based ranking with XP and P&L |
| Analysis | Per-trade review flagging alignment with or deviation from AI signal |

---

## Known Limitations

- No persistence. Portfolio, balance, trade history, and XP reset on page refresh. Everything lives in JavaScript variables.
- Yahoo Finance endpoint is unofficial. No API key, no documented rate limit, no guaranteed uptime. The server applies a 10-second timeout per request and falls back silently.
- Partial data outages are not shown per symbol. A single global Live/Simulated pill reflects overall fetch health, not per-instrument status.
- The predictor is not a trained model. It is a directional price nudge based on the existing signal.
- The leaderboard is mostly static. Five of six entries are hardcoded. The user rank is fixed at fourth regardless of actual performance.
- The news feed is static. Ten hardcoded headlines do not update. The timestamp refreshes visually every second but the content does not change.
- The /api/refresh endpoint is unauthenticated and can trigger upstream API calls if called repeatedly.

---

## Engineering Highlights

- Single-port architecture — Express HTTP and WebSocket share port 3000 via `http.createServer(app)` wrapping
- Cache-first data model — all 39 symbols fetched upfront, every UI interaction reads from cache with zero latency
- Parallel batched fetching — Yahoo Finance requests run 6 at a time via `Promise.all` reducing full refresh time from ~34 seconds sequential to ~6 seconds
- Pure indicator functions — `rsi()`, `macd()`, `bb()` take a price array and return a number, no side effects, ready for unit testing
- Synthetic ticking — random walk applied to cached prices every 4 seconds over WebSocket gives the UI a live feel without hammering upstream APIs
- Zero build toolchain — no webpack, no transpiler, no framework. The frontend is one HTML file that runs in any browser by opening it

---

## At a Glance

| | |
|---|---|
| Backend | Node.js, Express, ws |
| Frontend | Vanilla HTML/CSS/JS, Chart.js (CDN) |
| Lines of code | ~281 (server) + ~853 (frontend) |
| Database | None — in-memory only |
| Auth | None |
| Live data sources | Yahoo Finance (unofficial), CoinGecko (free tier) |
| Instruments tracked | 39 across 7 markets |
| Starting paper balance | Rs. 1,00,000 |
| Runtime dependencies | express, ws (72 packages total with transitive deps) |
| Port | 3000 (hardcoded) |

---

## Summary

Tradey demonstrates how to build a locally-run, zero-registration financial education tool by combining public market data APIs, a WebSocket real-time layer, and deterministic technical analysis into a single Node.js process. The platform's distinguishing property is that the learning system and the trading environment are the same application — a user reads about an indicator, sees it computed on live data, and trades against it without ever leaving the session or creating an account.
