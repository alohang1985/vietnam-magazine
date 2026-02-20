#!/usr/bin/env python3
"""
Long-running historical collector for 1m candles (simple polling POC).
- Polls bithumb public ticker every minute and appends minute-aligned rows to data/<PAIR>_1m.csv
- Intended to run under pm2 or launchd
"""
import time, os, requests, datetime, signal
PAIRS = ['BTC_KRW','ETH_KRW','SOL_KRW','XRP_KRW','DOT_KRW']
INTERVAL = 60  # seconds
WORKDIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(WORKDIR, 'data')
API_BASE = 'https://api.bithumb.com/public/ticker'
MAX_ROWS = 24*60*365  # keep up to ~1 year of 1m rows by default
running = True

os.makedirs(DATA_DIR, exist_ok=True)

def graceful(sig, frame):
    global running
    running = False

signal.signal(signal.SIGINT, graceful)
signal.signal(signal.SIGTERM, graceful)

def fetch_price(pair):
    try:
        url = f"{API_BASE}/{pair}"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return None
        j = r.json()
        if j.get('status') != '0000':
            return None
        closing = j['data'].get('closing_price')
        return float(closing)
    except Exception:
        return None

def append_row(pair, price):
    fname = os.path.join(DATA_DIR, f"{pair}_1m.csv")
    ts = datetime.datetime.utcnow().replace(second=0, microsecond=0).isoformat()
    line = f"{ts},{price}\n"
    try:
        with open(fname, 'a') as f:
            f.write(line)
        # optional trim
        with open(fname, 'r') as f:
            lines = f.readlines()
        if len(lines) > MAX_ROWS:
            with open(fname, 'w') as f:
                f.writelines(lines[-MAX_ROWS:])
    except Exception:
        pass

print('Starting historical collector')
while running:
    start = time.time()
    for p in PAIRS:
        price = fetch_price(p)
        if price is not None:
            append_row(p, price)
    # sleep until next minute boundary or INTERVAL
    elapsed = time.time() - start
    to_sleep = max(1, INTERVAL - int(elapsed))
    for _ in range(int(to_sleep)):
        if not running:
            break
        time.sleep(1)

print('collector stopped')
