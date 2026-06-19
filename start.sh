#!/bin/bash
cd "$(dirname "$0")"
(sleep 2 && (open http://localhost:3000 || xdg-open http://localhost:3000) 2>/dev/null) &
node server.js
