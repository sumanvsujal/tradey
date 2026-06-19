# Tradey - Paper Trading Simulator & Market Education

Lightweight paper trading platform built with Node.js, Express, WebSockets, and public market data APIs. Tradey provides live market monitoring, technical indicators, portfolio simulation, and educational content in a single application.

Users can analyze market data, view technical signals, execute simulated trades, and track portfolio performance without creating an account or connecting to a brokerage.

---

## Overview

Tradey combines live market data, technical analysis, and paper trading into a single application. Market data is fetched from public APIs, processed through technical indicator calculations, and delivered to the frontend through REST APIs and WebSocket updates.

The platform also includes educational modules covering trading fundamentals, technical indicators, risk management, and market analysis concepts.

---

## Highlights

* Live market data integration using Yahoo Finance and CoinGecko
* Real-time updates through WebSocket communication
* Technical indicators including RSI, MACD, and Bollinger Bands
* Rule-based BUY, HOLD, and SELL signal generation
* Simulated trading environment with portfolio tracking
* Virtual wallet with brokerage and transaction cost simulation
* Educational modules, quizzes, and achievement system
* Automatic fallback data generation when external APIs are unavailable

---

## Technical Implementation

* Express.js backend serving REST APIs and WebSocket connections
* In-memory caching for low-latency market updates
* Parallel market data retrieval using Promise.all
* Technical indicators implemented as pure functions
* Real-time portfolio valuation using current market prices
* Single-process architecture with HTTP and WebSocket services on the same port

---

## Limitations

* Portfolio data and progress are stored in memory and reset after application restart
* Yahoo Finance endpoints are unofficial and may change without notice
* News content is static and intended for demonstration purposes
* The forecasting module is heuristic-based and not a trained predictive model
* The leaderboard uses predefined sample entries

---

## Development

Run the server:

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

Basic health check:

```bash
curl http://localhost:3000/api/health
```

---

## License

MIT License

---

## Summary

Tradey is a local paper trading platform designed to explore financial analytics, technical analysis, real-time systems, and portfolio simulation. The project integrates live market data, WebSocket communication, trading workflows, and educational content within a lightweight Node.js architecture.

