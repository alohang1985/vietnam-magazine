#!/usr/bin/env bash
# Deploy backend (Strapi) using Railway CLI if available, otherwise print instructions.
set -e
if command -v railway >/dev/null 2>&1; then
  echo "Deploying backend to Railway..."
  railway up --detach || railway deploy
else
  echo "Railway CLI not found. To deploy backend, run on your machine:"
  echo "  railway up --service=backend" 
  echo "Or push repo and connect via Railway dashboard using railway.toml and Procfile."
fi
