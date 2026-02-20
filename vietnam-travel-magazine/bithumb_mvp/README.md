Bithumb MVP automatic trading package (MVP)

Overview
- Minimal set of scripts to collect BTC_KRW minute prices, backtest an EMA(20/50) strategy, run a simple paper trader, and a safe placeholder for live trading.
- Security: live order execution is intentionally disabled by default. You must implement and review signed API calls before enabling.

Quick start
1) Activate venv
   source /Users/youngdonjang/.openclaw/workspace/venv/bin/activate

2) (Optional) Store Bithumb API key/secret in macOS Keychain
   security add-generic-password -a "$USER" -s "BITHUMB_API_KEY" -w "YOUR_API_KEY"
   security add-generic-password -a "$USER" -s "BITHUMB_API_SECRET" -w "YOUR_API_SECRET"

3) Start fetching price data (in background)
   python3 /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/fetch_bithumb.py &

4) Run backtest
   python3 /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/backtest_ema.py

5) Run paper trader
   python3 /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/paper_trader.py

6) Live trading (disabled by default)
   - Edit live_trader.py and implement signed_post with Bithumb's API signing correctly.
   - Ensure API key has NO withdrawal permission.
   - Start: bash /Users/youngdonjang/.openclaw/workspace/bithumb_mvp/run_live.sh

Safety features
- monitor_killswitch.py will create STOPPED file when cumulative loss threshold is exceeded (default 50%).
- live_trader.py intentionally raises NotImplementedError on order signing to prevent accidental live orders.

Support
- If you want, I can implement signed_post and integrate live order execution after we do a manual security review together.
