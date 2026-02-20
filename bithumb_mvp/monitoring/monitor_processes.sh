#!/bin/bash
# Simple local monitor: records process list, CPU/mem for fetch_bithumb.py and node, and recent API errors (if any)
OUTDIR=$(dirname "$0")/reports
mkdir -p "$OUTDIR"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ps aux | egrep 'fetch_bithumb.py|node server.js' > "$OUTDIR/processes_$TS.txt"
# record top CPU/memory (macOS compatible)
ps -Ao user,pid,pcpu,pmem,comm | head -n 50 > "$OUTDIR/top_cpu_mem_$TS.txt"
# record disk usage of data dir if exists
if [ -d "../data" ]; then
  du -sh ../data > "$OUTDIR/data_du_$TS.txt"
  ls -lh ../data > "$OUTDIR/data_files_$TS.txt"
fi
# timestamp file for quick check
echo "$TS" > "$OUTDIR/last_run.txt"
# keep only last 100 reports (portable)
ls -1tr "$OUTDIR" | awk 'NR<=NF-100' | xargs -I{} rm -f "$OUTDIR/{}" 2>/dev/null || true

echo "Monitor run saved to $OUTDIR" >&2
