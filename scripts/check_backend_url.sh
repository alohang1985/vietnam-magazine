#!/usr/bin/env bash
set -e
if ! command -v railway >/dev/null 2>&1; then
  echo "railway CLI not found"
  exit 1
fi
STATUS=$(railway status --json 2>/dev/null || true)
if [ -z "$STATUS" ]; then
  echo "no status"
  exit 1
fi
# try to parse first service url
URL=$(echo "$STATUS" | grep -oE 'https?://[a-z0-9.-]+\.railway\.app' | head -n1 || true)
if [ -z "$URL" ]; then
  echo "no url found"
  exit 1
fi
echo $URL
