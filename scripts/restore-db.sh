#!/bin/sh
# =====================================================
# MKT Academy — Script restore PostgreSQL từ file backup
# Cách dùng: ./scripts/restore-db.sh backups/mkt-20260523-020000.sql.gz
# =====================================================
set -e

if [ -z "$1" ]; then
  echo "Cách dùng: $0 <file.sql.gz>"
  echo "Ví dụ: $0 backups/mkt-20260523-020000.sql.gz"
  exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "Không tìm thấy file: $FILE"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$PROJECT_DIR/.env" | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-mkt_admin}
POSTGRES_DB=${POSTGRES_DB:-mkt_academy}

echo "[!] CẢNH BÁO: Sẽ ghi đè database '$POSTGRES_DB'."
echo "Nhập 'YES' để xác nhận:"
read -r CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "Hủy."
  exit 1
fi

echo "[$(date)] Đang restore từ $FILE …"
gunzip -c "$FILE" | docker exec -i mkt-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "[$(date)] Xong."
