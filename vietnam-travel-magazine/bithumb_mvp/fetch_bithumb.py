import os, time, csv, requests, datetime

# Simple Bithumb public ticker/history fetcher (1m candles via public API simulation)
# Note: Bithumb provides public ticker/transactions. For historical OHLCV, this script will
# fetch recent ticks and aggregate to minute candles as a minimal approach for MVP.

PAIR = os.environ.get('BITHUMB_PAIR', 'BTC_KRW')
OUT_CSV = os.path.join(os.path.dirname(__file__), 'data', f'{PAIR}_1m.csv')
INTERVAL = int(os.environ.get('FETCH_INTERVAL_SEC', '60'))

os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)

def fetch_ticker(pair='BTC_KRW'):
    url = f'https://api.bithumb.com/public/ticker/{pair}'
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()
    if data.get('status') != '0000':
        raise SystemExit('Bithumb API error: ' + str(data))
    now = datetime.datetime.utcnow().replace(second=0, microsecond=0)
    price = float(data['data']['closing_price'])
    return now.isoformat(), price

if __name__ == '__main__':
    print('Starting simple fetch loop, writing to', OUT_CSV)
    header = ['timestamp','close']
    if not os.path.exists(OUT_CSV):
        with open(OUT_CSV,'w',newline='') as f:
            w = csv.writer(f)
            w.writerow(header)
    try:
        while True:
            ts, price = fetch_ticker(PAIR)
            with open(OUT_CSV,'a',newline='') as f:
                w = csv.writer(f)
                w.writerow([ts, price])
            print(ts, price)
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print('Stopped by user')
