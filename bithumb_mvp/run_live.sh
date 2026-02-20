#!/bin/bash
# WARNING: live mode requires you to have stored API key/secret in Keychain or ENV and verified no withdrawal permission.
source /Users/youngdonjang/.openclaw/workspace/venv/bin/activate
# Load key from Keychain (example)
API_KEY=$(security find-generic-password -a "$USER" -s "BITHUMB_API_KEY" -w)
API_SECRET=$(security find-generic-password -a "$USER" -s "BITHUMB_API_SECRET" -w)
export BITHUMB_API_KEY="$API_KEY"
export BITHUMB_API_SECRET="$API_SECRET"
# Run monitor and live trader (live_trader currently disabled for safety)
python3 /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/monitor_killswitch.py &
python3 /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/live_trader.py
