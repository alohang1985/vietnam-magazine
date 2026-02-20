import os, time, json

# Monitor simple trades log and enforce kill-switch if cumulative loss exceeds threshold
LOG_CSV = os.path.join(os.path.dirname(__file__), 'logs', 'paper_trades.csv')
THRESHOLD_PCT = float(os.environ.get('KILL_LOSS_PCT', '0.5'))  # 0.5 == 50%


def read_trades():
    if not os.path.exists(LOG_CSV):
        return []
    import csv
    with open(LOG_CSV,'r') as f:
        r = csv.DictReader(f)
        return list(r)

if __name__ == '__main__':
    print('Monitor running. Threshold pct:', THRESHOLD_PCT)
    while True:
        trades = read_trades()
        # naive: compute cash difference from initial if present
        if trades:
            first_cash = float(trades[0]['cash'])
            last_cash = float(trades[-1]['cash'])
            if first_cash>0:
                loss = (first_cash - last_cash) / first_cash
                if loss >= THRESHOLD_PCT:
                    print('KILL SWITCH: cumulative loss', loss)
                    # touch a file as stop signal
                    open(os.path.join(os.path.dirname(__file__),'STOPPED'),'w').write('stopped')
                    break
        time.sleep(30)
