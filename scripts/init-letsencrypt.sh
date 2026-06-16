#!/bin/sh
# =====================================================
# MKT Academy — Script cấp Let's Encrypt cert lần đầu
# Cách dùng: ./scripts/init-letsencrypt.sh
# Yêu cầu: DOMAIN_NAME trong .env đã trỏ về IP server (DNS A record)
# =====================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Load env
if [ ! -f .env ]; then
  echo "Không tìm thấy .env — copy từ .env.production.example trước."
  exit 1
fi
# shellcheck disable=SC2046
export $(grep -E '^(DOMAIN_NAME)=' .env | xargs)

if [ -z "$DOMAIN_NAME" ]; then
  echo "DOMAIN_NAME chưa được set trong .env"
  exit 1
fi

echo "[1/6] Domain: $DOMAIN_NAME"
echo "[2/6] Kiểm tra DNS — domain phải trỏ về IP server này:"
dig +short "$DOMAIN_NAME" || true

read -p "DNS đã đúng chưa? (y/N): " OK
if [ "$OK" != "y" ]; then
  echo "Hãy cấu hình DNS A record trỏ về IP server trước, rồi chạy lại."
  exit 1
fi

# Bước 3: tạo nginx config tạm chỉ HTTP để pass ACME challenge
echo "[3/6] Tạo nginx config tạm (HTTP only) …"
mkdir -p nginx/conf.d nginx/certbot/conf nginx/certbot/www
sed "s/DOMAIN_NAME/$DOMAIN_NAME/g" nginx/conf.d/app.http-only.conf > nginx/conf.d/_active.conf
# Tạm thời ẩn config HTTPS để nginx không lỗi (chưa có cert)
if [ -f nginx/conf.d/app.conf ]; then
  mv nginx/conf.d/app.conf nginx/conf.d/app.conf.disabled
fi
rm -f nginx/conf.d/app.http-only.conf.disabled

# Bước 4: start nginx + web + api + postgres
echo "[4/6] Khởi động services (nginx HTTP only) …"
docker compose -f docker-compose.standalone.yml up -d postgres api web nginx

# Đợi nginx
sleep 5

# Bước 5: xin cert từ Let's Encrypt
echo "[5/6] Đang xin cert từ Let's Encrypt …"
docker compose -f docker-compose.standalone.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
  --email admin@$DOMAIN_NAME \
  -d $DOMAIN_NAME -d www.$DOMAIN_NAME \
  --agree-tos --no-eff-email --non-interactive" certbot

# Bước 6: bật config HTTPS, reload nginx
echo "[6/6] Bật config HTTPS, reload nginx …"
rm nginx/conf.d/_active.conf
if [ -f nginx/conf.d/app.conf.disabled ]; then
  mv nginx/conf.d/app.conf.disabled nginx/conf.d/app.conf
fi
sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" nginx/conf.d/app.conf

docker compose -f docker-compose.standalone.yml exec nginx nginx -s reload || \
  docker compose -f docker-compose.standalone.yml restart nginx

echo ""
echo "✅ Xong! Truy cập: https://$DOMAIN_NAME"
echo "Cert sẽ tự gia hạn (container certbot kiểm tra mỗi 12h)."
