#!/usr/bin/env bash
# Reflected XSS Lab — Start All Servers
# Kills any dangling processes on ports 5000, 5001, 5002 first, then launches runner.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🧹 Checking and freeing ports 5000, 5001, 5002..."
fuser -k 5000/tcp 2>/dev/null
fuser -k 5001/tcp 2>/dev/null
fuser -k 5002/tcp 2>/dev/null
sleep 1

echo "🚀 Starting all Reflected XSS Lab servers..."
node src/server_runner.js
