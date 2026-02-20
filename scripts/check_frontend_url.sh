#!/usr/bin/env bash
set -e
if command -v vercel >/dev/null 2>&1; then
  vercel ls --tokens 2>/dev/null || true
  # Attempt to list projects and find domain
  vercel link --yes 2>/dev/null || true
  URL=$(vercel --prod --confirm --public 2>/dev/null | grep -oE 'https?://[a-z0-9.-]+\.vercel\.app' | head -n1 || true)
  if [ -n "$URL" ]; then
    echo $URL
    exit 0
  fi
fi
# fallback: read from .vercel/project.json
if [ -f ".vercel/project.json" ]; then
  DOMAIN=$(cat .vercel/project.json | grep -oE 'https?://[a-z0-9.-]+\.vercel\.app' | head -n1 || true)
  echo $DOMAIN
  exit 0
fi
echo "no frontend url found"
