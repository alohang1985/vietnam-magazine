import time, subprocess, os, sys
CHECK_PROC = None
# tail -F the log file and detect lines with PROBLEMS
LOG = os.path.join(os.path.dirname(__file__), '..', 'logs', 'data_quality.log')
LOG = os.path.abspath(LOG)
if not os.path.exists(LOG):
    open(LOG,'a').close()

def tail_f(path):
    with open(path,'r') as f:
        f.seek(0,2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            yield line

for line in tail_f(LOG):
    try:
        if 'PROBLEMS:' in line or 'ERROR:' in line:
            # gather recent snippet
            try:
                with open(LOG,'r') as rf:
                    lines = rf.read().splitlines()
                    snippet = "\n".join(lines[-10:])
            except Exception:
                snippet = line
            # send message via OpenClaw message bridge: write a small file for the agent to pick up
            notify_path = os.path.join(os.path.dirname(__file__), 'notify.out')
            with open(notify_path,'w') as nf:
                nf.write(f"ALERT\n{line.strip()}\n---\n{snippet}\n")
            # also print to stdout so pm2 captures
            print('NOTIFY:', line.strip())
            sys.stdout.flush()
    except Exception:
        pass
