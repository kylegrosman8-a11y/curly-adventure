#!/usr/bin/env bash
# SessionStart hook: ensure deps are installed so build/lint work in web sessions.
set -e
cd "$(dirname "$0")/../.."
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies…"
  npm install --no-audit --no-fund
fi
