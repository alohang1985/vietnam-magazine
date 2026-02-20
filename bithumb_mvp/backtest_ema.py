import os, pandas as pd
import numpy as np
import json

DATA_CSV = os.path.join(os.path.dirname(__file__), 'data', 'BTC_KRW_1m.csv')
OUT_REPORT = os.path.join(os.path.dirname(__file__), 'reports', 'backtest_ema_report.json')

os.makedirs(os.path.join(os.path.dirname(__file__), 'reports'), exist_ok=True)

# Simple EMA crossover backtester (20 / 50) with fixed position sizing
FEE_RATE = 0.0015  # example fee
SLIPPAGE = 0.001    # example slippage

def load_data(path):
    df = pd.read_csv(path, parse_dates=['timestamp'])
    df = df.sort_values('timestamp').set_index('timestamp')
    return df


def run_backtest(df, short=20, long=50, initial_cash=3000000, name='EMA'):
    # compute EMAs
    df = df.copy()
    df.loc[:, 'ema_s'] = df['close'].ewm(span=short, adjust=False).mean()
    df.loc[:, 'ema_l'] = df['close'].ewm(span=long, adjust=False).mean()
    df.loc[:, 'signal'] = 0
    df.loc[df.index[short:],'signal'] = np.where(df['ema_s'].iloc[short:] > df['ema_l'].iloc[short:], 1, 0)
    df.loc[:, 'position'] = df['signal'].diff().fillna(0)

    cash = initial_cash
    position = 0.0
    trade_log = []

    for ts, row in df.iterrows():
        price = row['close']
        if row['position'] == 1:  # buy
            budget = cash * 0.5  # aggressive: use 50% of cash per trade
            qty = (budget * (1 - FEE_RATE)) / (price * (1 + SLIPPAGE))
            cost = qty * price * (1 + SLIPPAGE)
            fee = cost * FEE_RATE
            if qty > 0:
                position += qty
                cash -= (cost + fee)
                trade_log.append({'ts': str(ts), 'side': 'buy', 'price': price, 'qty': qty, 'cash': cash})
        elif row['position'] == -1 and position > 0:  # sell
            qty = position
            proceeds = qty * price * (1 - SLIPPAGE)
            fee = proceeds * FEE_RATE
            cash += (proceeds - fee)
            trade_log.append({'ts': str(ts), 'side': 'sell', 'price': price, 'qty': qty, 'cash': cash})
            position = 0

    # compute equity (cash + position*price) time series for MDD
    equity_series = []
    cash = initial_cash
    position = 0.0
    trade_log = []

    for ts, row in df.iterrows():
        price = row['close']
        if row['position'] == 1:  # buy
            budget = cash * 0.5
            qty = (budget * (1 - FEE_RATE)) / (price * (1 + SLIPPAGE))
            cost = qty * price * (1 + SLIPPAGE)
            fee = cost * FEE_RATE
            if qty > 0:
                position += qty
                cash -= (cost + fee)
                trade_log.append({'ts': str(ts), 'side': 'buy', 'price': price, 'qty': qty, 'cash': cash})
        elif row['position'] == -1 and position > 0:  # sell
            qty = position
            proceeds = qty * price * (1 - SLIPPAGE)
            fee = proceeds * FEE_RATE
            cash += (proceeds - fee)
            trade_log.append({'ts': str(ts), 'side': 'sell', 'price': price, 'qty': qty, 'cash': cash})
            position = 0
        equity = cash + position * price
        equity_series.append({'ts': str(ts), 'equity': equity})

    final_value = equity_series[-1]['equity'] if equity_series else initial_cash
    returns = final_value - initial_cash

    # simple metrics
    sells = [t for t in trade_log if t['side']=='sell']
    wins = 0
    gross_win = 0
    gross_loss = 0
    for s in sells:
        idx = trade_log.index(s)
        buy = None
        for j in range(idx-1,-1,-1):
            if trade_log[j]['side']=='buy':
                buy = trade_log[j]
                break
        if buy:
            profit = (s['price']-buy['price'])*s['qty']
            if profit>0:
                wins+=1
                gross_win+=profit
            else:
                gross_loss+= -profit
    total_sells = len(sells)
    win_rate = (wins/total_sells*100) if total_sells>0 else 0
    profit_factor = (gross_win / gross_loss) if gross_loss>0 else (float('inf') if gross_win>0 else 0)

    # max drawdown from equity_series
    peak = -1
    mdd = 0
    for e in equity_series:
        val = e['equity']
        if val>peak: peak=val
        dd = (peak - val)/peak if peak>0 else 0
        if dd>mdd: mdd=dd

    # diagnostics
    rows = len(df)
    start = str(df.index[0]) if rows>0 else 'N/A'
    end = str(df.index[-1]) if rows>0 else 'N/A'

    report = {
        'name': name,
        'initial_cash': initial_cash,
        'final_value': final_value,
        'returns': returns,
        'trades': trade_log,
        'total_trades': total_sells,
        'wins': wins,
        'win_rate_pct': round(win_rate,2),
        'profit_factor': round(profit_factor,2) if profit_factor!=float('inf') else 'inf',
        'max_drawdown_pct': round(mdd*100,2),
        'data_rows': rows,
        'data_start': start,
        'data_end': end,
        'short': short,
        'long': long,
        'equity_series': equity_series
    }
    # write individual report
    with open(OUT_REPORT,'w',encoding='utf-8') as f:
        json.dump(report,f,ensure_ascii=False,indent=2)
    return report

    # end: mark-to-market
    final_value = cash + position * df['close'].iloc[-1]
    returns = final_value - initial_cash

    # simple metrics
    wins = sum(1 for t in trade_log if t['side']=='sell' and t['cash']>initial_cash)
    total_trades = sum(1 for t in trade_log if t['side']=='sell')

    report = {
        'initial_cash': initial_cash,
        'final_value': final_value,
        'returns': returns,
        'trades': trade_log,
        'total_trades': total_trades,
        'wins': wins
    }
    with open(OUT_REPORT,'w',encoding='utf-8') as f:
        json.dump(report,f,ensure_ascii=False,indent=2)
    return report

if __name__ == '__main__':
    if not os.path.exists(DATA_CSV):
        raise SystemExit('Data CSV not found: ' + DATA_CSV)
    df = load_data(DATA_CSV)
    print('Data rows:', len(df))
    # run two parameter sets: aggressive and conservative
    rpt_aggr = run_backtest(df, short=5, long=20, initial_cash=3000000, name='EMA_5_20')
    rpt_cons = run_backtest(df, short=20, long=50, initial_cash=3000000, name='EMA_20_50')
    print('Backtest complete. Report saved to', OUT_REPORT)
    # also save combined report
    combined = {'aggressive': rpt_aggr, 'conservative': rpt_cons}
    with open(os.path.join(os.path.dirname(__file__),'reports','backtest_combined.json'),'w',encoding='utf-8') as f:
        json.dump(combined,f,ensure_ascii=False,indent=2)
    print('Combined report saved to reports/backtest_combined.json')
