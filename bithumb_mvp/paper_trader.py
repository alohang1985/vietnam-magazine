import os, time, json, csv, datetime

PAIRS = os.environ.get('BITHUMB_PAIRS', 'BTC_KRW,ETH_KRW,SOL_KRW,XRP_KRW,DOT_KRW').split(',')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
LOG_CSV = os.path.join(os.path.dirname(__file__), 'logs', 'paper_trades.csv')

LOG_CSV = os.path.join(os.path.dirname(__file__), 'logs', 'paper_trades.csv')

os.makedirs(os.path.join(os.path.dirname(__file__), 'logs'), exist_ok=True)

class PaperTrader:
    def __init__(self, cash=50000):
        # allow overriding via env INITIAL_CASH (integer)
        env_cash = os.environ.get('INITIAL_CASH')
        if env_cash:
            try:
                cash = int(env_cash)
            except:
                pass
        self.cash = cash
        # positions per pair (qty) and avg entry price
        self.positions = {p:0.0 for p in PAIRS}
        self.avg_entry = {p:0.0 for p in PAIRS}
        self.trade_log = []

    def _append_log(self, entry):
        # ensure file header exists
        exists = os.path.exists(LOG_CSV)
        # allow optional fields like fee
        fieldnames = ['ts','pair','side','price','qty','cash','avg_entry','fee']
        # simple duplicate-guard: compare with last non-empty line
        try:
            if os.path.exists(LOG_CSV):
                with open(LOG_CSV, 'rb') as rf:
                    try:
                        rf.seek(-1024, os.SEEK_END)
                    except Exception:
                        rf.seek(0)
                    data = rf.read().decode('utf-8', errors='ignore')
                    lines = [l for l in data.splitlines() if l.strip()]
                    if lines:
                        last = lines[-1]
                        # compare key fields pair,side,price,qty
                        parts = last.split(',')
                        if len(parts) >= 6:
                            last_pair = parts[1]
                            last_side = parts[2]
                            last_price = parts[3]
                            last_qty = parts[4]
                            if str(entry.get('pair'))==last_pair and str(entry.get('side'))==last_side and str(entry.get('price'))==last_price and str(entry.get('qty'))==last_qty:
                                # duplicate detected; skip write
                                return
        except Exception:
            # on any error, proceed to append to avoid blocking trading
            pass
        # write with advisory file lock when possible
        try:
            f = open(LOG_CSV, 'a', newline='')
            try:
                import fcntl
                try:
                    fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                except Exception:
                    pass
            except Exception:
                # fcntl not available on some platforms
                pass
            w = csv.DictWriter(f, fieldnames=fieldnames)
            if not exists:
                w.writeheader()
            # write only keys present in fieldnames to avoid errors
            row = {k: entry.get(k, '') for k in fieldnames}
            w.writerow(row)
            try:
                f.flush()
                os.fsync(f.fileno())
            except Exception:
                pass
            try:
                import fcntl
                try:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                except Exception:
                    pass
            except Exception:
                pass
            f.close()
        except Exception:
            # last resort: try append without lock
            try:
                with open(LOG_CSV, 'a', newline='') as f2:
                    w2 = csv.DictWriter(f2, fieldnames=fieldnames)
                    if not exists:
                        w2.writeheader()
                    row = {k: entry.get(k, '') for k in fieldnames}
                    w2.writerow(row)
            except Exception:
                pass

    def buy(self, pair, price, budget):
        # simulate slippage and fee if configured
        slippage_pct = float(os.environ.get('SLIPPAGE_PCT', '0.0005'))  # default 0.05%
        fee_pct = float(os.environ.get('FEE_PCT', '0.0005'))  # default 0.05%
        slipped_price = price * (1 + slippage_pct)
        qty = budget / slipped_price
        cost = qty * slipped_price
        fee = cost * fee_pct
        total_cost = cost + fee
        prev_qty = self.positions.get(pair,0)
        prev_avg = self.avg_entry.get(pair,0) if prev_qty>0 else 0
        new_total_qty = prev_qty + qty
        # compute new average entry
        if new_total_qty>0:
            new_avg = (prev_avg*prev_qty + slipped_price*qty)/new_total_qty
        else:
            new_avg = 0
        self.positions[pair] = new_total_qty
        self.avg_entry[pair] = new_avg
        self.cash -= total_cost
        entry = {'ts': datetime.datetime.utcnow().isoformat(), 'pair':pair, 'side':'buy','price':slipped_price,'qty':qty,'cash':self.cash,'avg_entry':new_avg,'fee':fee}
        self.trade_log.append(entry)
        self._append_log(entry)

    def sell(self, pair, price, qty=None):
        slippage_pct = float(os.environ.get('SLIPPAGE_PCT', '0.0005'))
        fee_pct = float(os.environ.get('FEE_PCT', '0.0005'))
        current_qty = self.positions.get(pair,0)
        if current_qty<=0:
            return None
        # if qty not provided, sell all
        if qty is None:
            qty = current_qty
        # ensure we don't sell more than we have
        qty = min(qty, current_qty)
        slipped_price = price * (1 - slippage_pct)
        proceeds = qty * slipped_price
        fee = proceeds * fee_pct
        net_proceeds = proceeds - fee
        self.cash += net_proceeds
        entry = {'ts': datetime.datetime.utcnow().isoformat(), 'pair':pair, 'side':'sell','price':slipped_price,'qty':qty,'cash':self.cash,'fee':fee}
        self.trade_log.append(entry)
        self._append_log(entry)
        # reduce or clear position
        remaining = current_qty - qty
        if remaining <= 0:
            self.positions[pair] = 0
            self.avg_entry[pair] = 0
        else:
            self.positions[pair] = remaining
        return entry

    def status(self):
        return {'cash':self.cash,'positions':self.positions,'avg_entry':self.avg_entry}



def load_latest_price_for(pair):
    file = os.path.join(DATA_DIR, f"{pair}_1m.csv")
    if not os.path.exists(file):
        return None
    try:
        with open(file,'r') as f:
            rows = list(csv.reader(f))
            if not rows:
                return None
            last = rows[-1]
            if len(last) < 2:
                return None
            # assume format: timestamp,close
            try:
                return float(last[1])
            except:
                return None
    except Exception:
        return None

if __name__ == '__main__':
    # read style and initial cash from env
    style = os.environ.get('TRADING_STYLE', 'balanced')
    trader = PaperTrader()
    print(f'Starting paper trader. Style={style}. Press Ctrl+C to stop.')

    # hybrid strategy parameters (overrides style for our new DCA strategy)
    initial_balance = os.environ.get('INITIAL_CASH')
    try:
        if initial_balance:
            trader.cash = int(initial_balance)
    except:
        pass

    # strategy params
    size_pct = 0.075  # initial entry percent
    max_exposure = 0.5  # max account exposure
    dca_step = 0.02  # 2% drop triggers DCA
    dca_scale = 0.6  # each DCA size = prev * dca_scale
    max_dca_steps = 5
    tp_partial = 1.04  # 4% -> sell half
    tp_final = 1.10    # 10% -> sell remaining
    sl_total = 0.92    # -8% from avg entry -> sell all

    # helper trackers
    dca_counts = {p:0 for p in PAIRS}

    import json
    TUNING_FILE = os.path.join(os.path.dirname(__file__), 'tuning.json')
    def load_tuning():
        try:
            if os.path.exists(TUNING_FILE):
                with open(TUNING_FILE,'r') as tf:
                    return json.load(tf)
        except Exception:
            return {}
        return {}

    try:
        fast_mode = os.environ.get('FAST_MODE')
        sleep_sec = 5 if fast_mode=='1' else 60
        while True:
            tuning = load_tuning() or {}
            # iterate pairs
            for pair in PAIRS:
                # allow per-pair override from tuning
                pair_tune = tuning.get(pair, {})
                p_size_pct = pair_tune.get('size_pct', size_pct)
                p_max_exposure = pair_tune.get('max_exposure', max_exposure)
                p_dca_step = pair_tune.get('dca_step', dca_step)
                p_dca_scale = pair_tune.get('dca_scale', dca_scale)
                p_max_dca_steps = pair_tune.get('max_dca_steps', max_dca_steps)
                p_tp_partial = pair_tune.get('tp_partial', tp_partial)
                p_tp_final = pair_tune.get('tp_final', tp_final)
                p_sl_total = pair_tune.get('sl_total', sl_total)

                price = load_latest_price_for(pair)
                if price is None:
                    continue
                pos_qty = trader.positions.get(pair,0)
                # compute account value approx
                positions_value = sum(trader.positions.get(x,0) * (load_latest_price_for(x) or 0) for x in PAIRS)
                account_value = trader.cash + positions_value

                if pos_qty<=0:
                    # initial buy if we have room
                    init_budget = trader.cash * p_size_pct
                    if init_budget >= 1000 and (positions_value/account_value) < p_max_exposure:
                        trader.buy(pair, price, init_budget)
                        dca_counts[pair] = 0
                        print('BUY init', pair, price, 'budget', init_budget, 'cash left', trader.cash)
                else:
                    avg_entry = trader.avg_entry.get(pair, price)
                    # partial take profit
                    if price >= avg_entry * p_tp_partial and trader.positions.get(pair,0) > 0:
                        sell_qty = trader.positions.get(pair,0) * 0.5
                        trader.sell(pair, price, qty=sell_qty)
                        print('SELL-PARTIAL', pair, price, 'sold', sell_qty, 'cash', trader.cash)
                    # final take profit
                    elif price >= avg_entry * p_tp_final and trader.positions.get(pair,0) > 0:
                        trader.sell(pair, price)
                        dca_counts[pair] = 0
                        print('SELL-FINAL', pair, price, 'cash', trader.cash)
                    # stop loss
                    elif price <= avg_entry * p_sl_total:
                        trader.sell(pair, price)
                        dca_counts[pair] = 0
                        print('SELL-SL', pair, price, 'cash', trader.cash)
                    else:
                        # consider DCA
                        last_buy_price = None
                        for e in reversed(trader.trade_log):
                            if e['pair']==pair and e['side']=='buy':
                                last_buy_price = e['price']
                                break
                        if last_buy_price is None:
                            last_buy_price = avg_entry
                        # check exposure room
                        current_exposure = positions_value / account_value if account_value>0 else 0
                        if price <= last_buy_price * (1 - p_dca_step) and dca_counts[pair] < p_max_dca_steps and current_exposure < p_max_exposure:
                            # compute DCA budget
                            prev_budget = trader.cash * p_size_pct if dca_counts[pair]==0 else trader.cash * (p_size_pct * (p_dca_scale ** dca_counts[pair]))
                            budget = max(prev_budget, 1000)
                            if budget >= 1000:
                                trader.buy(pair, price, budget)
                                dca_counts[pair] += 1
                                print('DCA BUY', pair, price, 'budget', budget, 'dca_count', dca_counts[pair], 'cash', trader.cash)
                # short sleep between pairs
                time.sleep(0.5)
            time.sleep(sleep_sec)
    except KeyboardInterrupt:
        print('Stopped. Trades:')
        for t in trader.trade_log:
            print(t)
        print('Saved log to', LOG_CSV)
