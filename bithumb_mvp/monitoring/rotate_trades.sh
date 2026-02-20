#!/bin/bash
# rotate_trades.sh - simple daily rotation for paper_trades.csv
WORKDIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="$WORKDIR/logs"
mkdir -p "$LOGS_DIR"
FILE="$LOGS_DIR/paper_trades.csv"
if [ ! -f "$FILE" ]; then
  echo "ts,pair,side,price,qty,cash" > "$FILE"
  exit 0
fi
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
ARCHIVE="$LOGS_DIR/paper_trades.$TIMESTAMP.csv"
mv "$FILE" "$ARCHIVE"
# create new file with header
echo "ts,pair,side,price,qty,cash" > "$FILE"
# keep last 14 archives
ls -1t "$LOGS_DIR"/paper_trades.*.csv 2>/dev/null | sed -e '1,14d' | xargs -r rm -f
echo "Rotated trades to $ARCHIVE" >&2
