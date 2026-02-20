import json, os
from math import inf

report_path = os.path.join(os.path.dirname(__file__), 'reports', 'backtest_combined.json')
if not os.path.exists(report_path):
    raise SystemExit('report not found')

with open(report_path,'r',encoding='utf-8') as f:
    data = json.load(f)

summary = {}
for k,v in data.items():
    trades = v.get('trades',[])
    # compute round-trip profits: accumulate cash changes at sell events
    initial = v.get('initial_cash',0)
    cash_series = [initial]
    # simulate cash curve using trade 'cash' entries when present
    for t in trades:
        if 'cash' in t:
            cash_series.append(t['cash'])
    if len(cash_series)<=1:
        mdd = 0
        returns = v.get('returns',0)
    else:
        peak = -inf
        mdd = 0
        peak = cash_series[0]
        for x in cash_series:
            if x>peak: peak=x
            dd = (peak - x)/peak
            if dd>mdd: mdd=dd
        returns = cash_series[-1]-initial
    # wins / total sells
    sells = [t for t in trades if t['side']=='sell']
    wins = 0
    gross_win = 0
    gross_loss = 0
    for s in sells:
        # find matching buy before this sell
        idx = trades.index(s)
        buy = None
        for j in range(idx-1,-1,-1):
            if trades[j]['side']=='buy':
                buy=trades[j]
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

    summary[k]={
        'initial': initial,
        'final_value': v.get('final_value'),
        'returns': returns,
        'total_trades': v.get('total_trades', total_sells),
        'total_sells': total_sells,
        'wins': wins,
        'win_rate_pct': round(win_rate,2),
        'profit_factor': round(profit_factor,2) if profit_factor!=float('inf') else 'inf',
        'max_drawdown_pct': round(mdd*100,2)
    }

out = os.path.join(os.path.dirname(__file__),'reports','backtest_metrics.json')
with open(out,'w',encoding='utf-8') as f:
    json.dump(summary,f,ensure_ascii=False,indent=2)
print('Metrics saved to', out)
print(json.dumps(summary,indent=2,ensure_ascii=False))
