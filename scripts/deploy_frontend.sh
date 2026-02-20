#!/usr/bin/env bash
set -e
if command -v vercel >/dev/null 2>&1; then
  echo "Deploying frontend to Vercel..."
  vercel --prod
elif command -v railway >/dev/null 2>&1; then
  echo "Deploying frontend to Railway (static)..."
  railway up --detach --service=frontend
else
  echo "Vercel/Railway CLI not found. To deploy frontend, run on your machine:"
  echo "  vercel --prod (in apps/frontend-next)"
fi
