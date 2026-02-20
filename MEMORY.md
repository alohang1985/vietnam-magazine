# MEMORY

## 2026-02-18 — 코인자동매매 프로그램 (bithumb_mvp)
- 요약: 코인자동매매 프로그램: bithumb_mvp 프로젝트
  - 주요파일: fetch_bithumb.py (분 단위 가격 수집), backtest_ema.py (EMA 백테스트), paper_trader.py (페이퍼 트레이더)
  - 안전: live_trader.py 서명 미구현(실거래 의도적 비활성), monitor_killswitch 및 README의 보안 권고(키는 macOS Keychain 권장)
  - 데이터/로그 경로: ./data/*.csv, ./logs/paper_trades.csv, ./reports/*.json, tuning.json로 런타임 튜닝 가능

(저장된 시각: 2026-02-18)

## 2026-02-19 — 중지된 서비스 및 재시작 가능 항목
- 중지된 서비스(요청으로 중지함): price-feeder / price_feeder, paper_trader, historical-collector, data_quality, data_quality_notifier, frontend (dashboard)
- 재시작 가능 방법 요약:
  - pm2 개별 재시작: pm2 start <name> 또는 pm2 restart <name>
  - 전체 복원: pm2 resurrect (pm2 save 상태 기준)
  - 개별 경로 재시작: pm2 start /path/to/script --name <name> --interpreter /path/to/python --update-env
  - 수동 백그라운드: ./.venv/bin/python script.py &
- 재시작 권장 체크리스트: 가상환경(.venv) 확인, 의존성 설치(pip), .env/키 확인(비공개), 로그 모니터링(pm2 logs)

(저장된 시각: 2026-02-19)
