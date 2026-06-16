# MKT Academy - Deploy len VPS sau reverse proxy ngoai

Tai lieu nay dung cho mo hinh:

- app `khoahocsales` chay chung VPS voi project khac
- HTTPS va reverse proxy do `Caddy` hoac `Nginx` ben ngoai xu ly
- project nay khong mo port `80/443`
- domain: `khoahoc.nhansuchat.vn`

## 1. Kien truc

- `web` (Next.js): `127.0.0.1:3004`
- `api` (NestJS): `127.0.0.1:4000`
- `postgres` chi nam trong Docker network, khong public ra internet

Compose dung de deploy:

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

## 2. Chuan bi source

```bash
cd /home
git clone <repo> khoahocsales
cd /home/khoahocsales
```

Neu repo da co san:

```bash
cd /home/khoahocsales
git pull origin main
```

## 3. Tao file env production

```bash
cp .env.production.example .env
nano .env
```

Gia tri production cho domain nay:

```env
DOMAIN_NAME=khoahoc.nhansuchat.vn
POSTGRES_USER=mkt_admin
POSTGRES_PASSWORD=ChangeMe_StrongPasswordHere_2026
POSTGRES_DB=mkt_academy
POSTGRES_PORT=5432

DATABASE_URL=postgresql://mkt_admin:ChangeMe_StrongPasswordHere_2026@postgres:5432/mkt_academy?schema=public

NODE_ENV=production
API_PORT=4000
API_HOST=0.0.0.0

JWT_ACCESS_SECRET=REPLACE_ME_with_openssl_rand_base64_48
JWT_REFRESH_SECRET=REPLACE_ME_with_DIFFERENT_openssl_rand_base64_48
COOKIE_SECRET=REPLACE_ME_with_openssl_rand_base64_48
AI_CONFIG_SECRET=REPLACE_ME_with_openssl_rand_base64_48
COOKIE_SECURE=true

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

OPENAI_API_KEY=sk-replace-with-real-key
GEMINI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1500
OPENAI_DAILY_LIMIT_PER_USER=20

CORS_ORIGIN=https://khoahoc.nhansuchat.vn
NEXT_PUBLIC_API_URL=https://khoahoc.nhansuchat.vn/api
NEXT_PUBLIC_SOCKET_URL=https://khoahoc.nhansuchat.vn
NEXT_PUBLIC_BASE_PATH=
```

Luu y:

- `NEXT_PUBLIC_API_URL` co the de `/api` o cuoi; frontend da duoc normalize de khong bi `/api/api/v1`.
- `COOKIE_SECURE=true` vi session/chung thuc di qua HTTPS ben ngoai.

## 4. Deploy app

```bash
cd /home/khoahocsales
docker compose -f docker-compose.vps.yml up -d --build
```

Kiem tra:

```bash
docker compose -f docker-compose.vps.yml ps
curl -I http://127.0.0.1:3004
curl -I http://127.0.0.1:4000/api/v1/auth/me
```

Ket qua mong doi:

- `web` len `200 OK`
- `api` len `401 Unauthorized` cho `/auth/me` la binh thuong

## 5. Seed database trong container API

Lenh seed da duoc sua de chay on dinh trong container:

```bash
docker compose -f docker-compose.vps.yml exec api \
  sh -lc "cd /app/apps/api && npm run prisma:seed"
```

Kiem tra user sau seed:

```bash
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U mkt_admin -d mkt_academy -c "SELECT id, name, email, role FROM users ORDER BY role, email;"
```

Tai khoan admin mac dinh trong seed:

- `phamtuan91yb@gmail.com`
- `VietNam2025@`

## 6. Caddy reverse proxy ben ngoai

Vi du Caddyfile:

```caddyfile
khoahoc.nhansuchat.vn {
    encode zstd gzip

    reverse_proxy /api/* 127.0.0.1:4000
    reverse_proxy /socket.io/* 127.0.0.1:4000
    reverse_proxy 127.0.0.1:3004
}
```

Neu can giu them site khac tren cung VPS, Caddy chi can them block rieng cho domain nay.

## 7. Update ban moi

```bash
cd /home/khoahocsales
git pull origin main
docker compose -f docker-compose.vps.yml up -d --build
```

## 8. Ghi chu van hanh

- khong dung `docker-compose.prod.yml` cho VPS nay neu ben ngoai da co Caddy/Nginx
- khong can `nginx/conf.d/*` va `certbot` trong project cho kieu deploy nay
- khong public port Postgres ra internet
- neu doi domain, chi can sua `.env` roi rebuild lai `web`
