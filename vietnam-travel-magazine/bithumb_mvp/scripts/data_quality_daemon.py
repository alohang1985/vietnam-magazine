import time, subprocess, os
SCRIPT_DIR = os.path.dirname(__file__)
CHECK = os.path.join(SCRIPT_DIR, 'check_data_quality.py')
LOG = os.path.join(os.path.dirname(SCRIPT_DIR), 'logs', 'data_quality.log')
INTERVAL = int(os.environ.get('DATA_QUALITY_INTERVAL_SEC','300'))

def run_check():
    try:
        p = subprocess.run(['python3', CHECK], capture_output=True, text=True, timeout=60)
        out = p.stdout.strip()
    except Exception as e:
        out = f'ERROR: {e}'
    ts = time.strftime('%Y-%m-%dT%H:%M:%S')
    with open(LOG,'a') as f:
        f.write(f"{ts} {out}\n")
    # also print to stdout for pm2 logs
    print(ts, out)

if __name__=='__main__':
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    while True:
        run_check()
        time.sleep(INTERVAL)
