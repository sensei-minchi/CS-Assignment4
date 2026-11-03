#!/usr/bin/env bash
# Reflected XSS Lab — Stop All Servers

echo "🛑 Stopping all Reflected XSS Lab processes on ports 5000, 5001, 5002..."
fuser -k 5000/tcp 2>/dev/null
fuser -k 5001/tcp 2>/dev/null
fuser -k 5002/tcp 2>/dev/null
echo "✅ All servers stopped cleanly."
