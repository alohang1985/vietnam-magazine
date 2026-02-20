import os, csv
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_DIR = os.path.abspath(DATA_DIR)
problems = []
for fn in os.listdir(DATA_DIR):
    if fn.endswith('_1m.csv'):
        path = os.path.join(DATA_DIR, fn)
        with open(path,'r') as f:
            rows = list(csv.reader(f))
            if not rows:
                problems.append((fn,'empty'))
            else:
                last = rows[-1]
                if len(last) < 2:
                    problems.append((fn,'last_row_too_short'))
                else:
                    try:
                        float(last[1])
                    except Exception:
                        problems.append((fn,'invalid_close'))
print('OK' if not problems else 'PROBLEMS:')
for p in problems:
    print(p)
