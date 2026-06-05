#!/bin/sh
# =====================================================
# MKT Academy — Script backup PostgreSQL
# Chạy hằng ngày qua cron — giữ 14 ngày gần nhất
# Đặt cron trên HOST:
#   0 2 * * * /home/mkt/khoahocsale/scripts/backup-db.sh >> /var/log/mkt-backup.log 2>&1
# =====================================================
set -e

# Đường dẫn tới thư mục project trên host (chỉnh nếu khác)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
RETAIN_DAYS=14

# Load env
if [ -f "$PROJECT_DIR/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$PROJECT_DIR/.env" | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-mkt_admin}
POSTGRES_DB=${POSTGRES_DB:-mkt_academy}

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/mkt-${STAMP}.sql.gz"

echo "[$(date)] Bắt đầu backup → $FILE"
docker exec mkt-postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
  | gzip > "$FILE"

# Dọn file cũ hơn RETAIN_DAYS
find "$BACKUP_DIR" -name 'mkt-*.sql.gz' -type f -mtime +$RETAIN_DAYS -delete

echo "[$(date)] Xong — kích thước $(du -h "$FILE" | cut -f1)"
