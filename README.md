# Tradey — Paper Trading Simulator & Market Education

Lightweight, local-first paper trading environment with live price feeds, deterministic technical indicators, and an in-app curriculum for learning trading concepts hands-on.

Key ideas: zero registration, zero risk, no external accounts — run locally with Node.js and open the UI in your browser.

---

## Quick Links

- Live demo: http://localhost:3000 (when server is running)
- Start (Windows): `start.bat`
- Start (manual): `node server.js`

---

## Overview

Tradey combines three things in one place: live market data ingestion, rule-based signal generation, and a paper trading interface tied to a short learning curriculum. Users can inspect indicators (RSI/MACD/BB), view signals, and execute simulated trades against live or fallback data.

Designed to be simple to run: Node.js (LTS) is required; `node_modules` is bundled so no `npm install` is necessary for a typical zip distribution.

---

## Highlights

- Live price ingestion from Yahoo Finance (unofficial) and CoinGecko (crypto)
- WebSocket ticks broadcast every 4 seconds for a live UI experience
- Deterministic indicators: RSI(14), MACD(12,26), Bollinger Band width (20)
- Rule-based signal engine producing BUY / HOLD / SELL + confidence score (32–88 clamp)
- Paper trading wallet with simulated fees and weighted-average position tracking
- Built-in 9-lesson curriculum, quizzes, and basic achievement/XP mechanics
- Graceful fallback to generated random-walk histories when upstream data is unavailable

---

## Plain, Smooth Architecture

Conceptual flow (simple):

1. Server startup runs `fetchAll()` to pull historical and current prices from external APIs.
2. Per-symbol processing extracts a 65-day close series and computes indicators via pure functions (`rsi()`, `macd()`, `bb()`).
3. `signal()` scores each symbol and `build()` assembles a market object stored in an in-memory `CACHE`.
4. The API serves the cached dataset (`/api/markets`, `/api/quote/:sym`) while a `tick()` loop mutates prices slightly and broadcasts minimal updates via WebSocket.
5. Frontend loads a full dataset on connect, renders charts (Chart.js), subscribes to ticks, and updates the UI and simulated portfolio in real time.

Mermaid overview:

```mermaid
flowchart LR
  A[Yahoo Finance / CoinGecko] --> B[fetchAll()]
  B --> C[Indicator functions: rsi, macd, bb]
  C --> D[signal() -> build()]
  D --> E[CACHE (in-memory)]
  E --> F[/api/markets, /api/quote]
  E --> G[WebSocket ticks (every 4s)]
  G --> H[Browser UI: charts, markets, trade]
```

This keeps the runtime simple: single Node process, HTTP + WS on the same port, and an in-memory cache feeding a single-page frontend.

---

## Signal Rules (concise)

Start at 50; adjust by rules and clamp to [32, 88]. Interpretations:

| Condition | Delta |
|---|---:|
| RSI < 30 | +20 |
| RSI < 45 | +10 |
| RSI > 70 | -20 |
| RSI > 60 | -10 |
| MACD bullish | +15 |
| MACD bearish | -15 |
| Price > 10-day avg | +10 |
| Price < 10-day avg | -10 |

Score >= 62 → BUY; <= 44 → SELL; otherwise HOLD. The score is shown as confidence.

---

## Run (quickstart)

Requirements: Node.js LTS installed.

Windows: double-click `start.bat` or run in PowerShell:

```powershell
.\start.bat
```

Manual:

```bash
node server.js
# then open http://localhost:3000
```

API quick check:

```bash
curl http://localhost:3000/api/health
```

---

## API Endpoints

- `GET /api/health` — basic server health, symbols, last fetch, uptime
- `GET /api/markets` — full cached dataset by market
- `GET /api/quote/:symbol` — single symbol object
- `GET /api/news` — static news feed
- `POST /api/refresh` — trigger immediate fetchAll()

---

## Project Layout

```
tradey/
├─ server.js         # backend: data ingestion, WS, API routes
├─ public/
│  └─ index.html     # frontend (single-file SPA)
├─ node_modules/     # bundled for zip distributions
├─ package.json
├─ start.bat
└─ README.md
```

---

## Limitations & Safety Notes

- No persistent storage: portfolio and XP reset on refresh.
- Yahoo Finance usage is unofficial and may be rate-limited or change.
- `/api/refresh` is unauthenticated — avoid rapid calls.

This project is intended for local, educational use only.

---

## Development

- Core functions are pure and easy to unit-test (`rsi`, `macd`, `bb`).
- To run or debug: start `node server.js` and open the browser at `http://localhost:3000`.

Suggested tests:

```bash
# health check
curl http://localhost:3000/api/health
```

---

## License & Contact

MIT license. Raise issues or PRs on the repository.

---

If you want, I can open a PR with this README, add badges, or create a `CONTRIBUTING.md` next.
