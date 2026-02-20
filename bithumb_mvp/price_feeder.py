#!/usr/bin/env python3
"""
Hybrid price feeder: WebSocket-first (if available) with REST fallback.
- Tries WS (if endpoint provided). If WS not connected or no messages for FALLBACK_SEC, uses REST polling.
- Keeps local CSVs updated and logs health.

Usage: configured to run under pm2; requires requests and websocket-client.
"""
import time, os, sys, requests, datetime, signal, threading
try:
    import websocket
    WS_AVAILABLE = True
except Exception:
    WS_AVAILABLE = False

PAIRS = ['BTC_KRW','ETH_KRW','SOL_KRW','XRP_KRW','DOT_KRW']
INTERVAL = 5  # REST poll interval when active (seconds)
FALLBACK_SEC = 10  # if no WS message in this many seconds, enable REST fallback
WORKDIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(WORKDIR, 'data')
API_BASE = 'https://api.bithumb.com/public/ticker'
MAX_ROWS = 1440
LOG_DIR = os.path.join(WORKDIR, '..', 'logs')
LOG_FILE = os.path.join(LOG_DIR, 'price_feeder.log')
running = True
last_ws_ts = 0
ws_lock = threading.Lock()
USE_WS = False
WS_ENDPOINTS = {
  # Keep as placeholder — will try if set. Example: 'wss://pubwss.bithumb.com/pub/ws' (verify before use)
  'bithumb': ''
}

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

def log(msg):
    ts = datetime.datetime.utcnow().isoformat()
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(f"{ts} {msg}\n")
    except Exception:
        pass

def graceful(sig, frame):
    global running
    running = False

signal.signal(signal.SIGINT, graceful)
signal.signal(signal.SIGTERM, graceful)

# WS handlers (run in separate thread if websocket-client available)
def ws_on_message(ws, message):
    global last_ws_ts
    try:
        import json
        obj = json.loads(message)
        # Depending on exchange message format, extract pair and price
        # This is a placeholder: user should replace with actual parsing for the WS source
        # Example expected obj: { 'type':'ticker', 'symbol':'BTC_KRW', 'close':'123' }
        pair = obj.get('symbol') or obj.get('pair')
        price = None
        if 'close' in obj:
            try:
                price = float(obj['close'])
            except Exception:
                price = None
        if pair and price:
            append_row(pair, price)
            with ws_lock:
                last_ws_ts = time.time()
    except Exception as e:
        log(f"ws msg parse error: {e}")

def ws_on_error(ws, err):
    log(f"ws error: {err}")

def ws_on_close(ws, code, reason):
    log(f"ws closed: {code} {reason}")

def ws_on_open(ws):
    log("ws open")
    with ws_lock:
        global last_ws_ts
        last_ws_ts = time.time()

def start_ws(endpoint):
    try:
        ws = websocket.WebSocketApp(endpoint,
                                    on_open=ws_on_open,
                                    on_message=ws_on_message,
                                    on_error=ws_on_error,
                                    on_close=ws_on_close)
        t = threading.Thread(target=ws.run_forever, kwargs={'ping_interval':30, 'ping_timeout':10})
        t.daemon = True
        t.start()
        return True
    except Exception as e:
        log(f"ws start failed: {e}")
        return False

# REST fallback
def fetch_price(pair):
    try:
        url = f"{API_BASE}/{pair}"
        r = requests.get(url, timeout=8)
        if r.status_code != 200:
            return None
        j = r.json()
        if j.get('status') != '0000':
            return None
        closing = j['data'].get('closing_price')
        return float(closing)
    except Exception as e:
        log(f"rest fetch error {pair}: {e}")
        return None

def append_row(pair, price):
    fname = os.path.join(DATA_DIR, f"{pair}_1m.csv")
    ts = datetime.datetime.utcnow().replace(second=0, microsecond=0).isoformat()
    line = f"{ts},{price}\n"
    try:
        with open(fname, 'a') as f:
            f.write(line)
        with open(fname, 'r') as f:
            lines = f.readlines()
        if len(lines) > MAX_ROWS:
            with open(fname, 'w') as f:
                f.writelines(lines[-MAX_ROWS:])
    except Exception as e:
        log(f"append error {pair}: {e}")

log('Starting hybrid price_feeder')
# Try WS if websocket-client available and endpoint configured
if WS_AVAILABLE and WS_ENDPOINTS.get('bithumb'):
    ok = start_ws(WS_ENDPOINTS['bithumb'])
    if ok:
        log('WS started')
        USE_WS = True
    else:
        log('WS not started, will use REST fallback')
else:
    log('WS not available or endpoint not configured; using REST fallback')

# main loop: prefer WS; if no WS messages for FALLBACK_SEC, use REST polling
while running:
    now = time.time()
    with ws_lock:
        last = last_ws_ts
    use_rest = True
    if USE_WS and last and (now - last) < FALLBACK_SEC:
        use_rest = False
    if use_rest:
        # REST polling
        for p in PAIRS:
            price = fetch_price(p)
            if price is not None:
                append_row(p, price)
        # sleep INTERVAL seconds
        for _ in range(int(INTERVAL)):
            if not running:
                break
            time.sleep(1)
    else:
        # WS mode: wait a short time and check again
        time.sleep(1)

log('price_feeder stopped')
