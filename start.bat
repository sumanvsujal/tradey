@echo off
title Tradey
node --version >nul 2>&1 || (echo Install Node.js from nodejs.org && pause && exit)
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
