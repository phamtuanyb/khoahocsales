# MKT Academy — Hướng dẫn deploy lên server nội bộ

Tài liệu này hướng dẫn deploy **MKT Academy** lên 1 server Linux nội bộ của MKT
(self-host bằng Docker Compose + Nginx + Let's Encrypt).

> **Kịch bản đã chọn:**
> - Server riêng nội bộ MKT (Ubuntu/Debian Linux)
> - Video: dùng link YouTube unlisted / Cloudinary / Google Drive (đã hỗ trợ)
> - Đã có domain riêng (vd: `academy.mktsoftware.vn`)
> - Quy mô 50-500 user

---

## 1. Yêu cầu server

### Cấu hình tối thiểu (50-500 user)
- **CPU**: 2 vCPU
- **RAM**: 4 GB (khuyến nghị 8 GB)
- **Đĩa**: 40 GB SSD (DB + log + backup)
- **OS**: Ubuntu 22.04 LTS hoặc Debian 12
- **Mạng**: IP public, mở port **80** và **443**
- **Domain**: đã trỏ DNS A record về IP server

### Phần mềm cần cài trên server
```bash
# Cập nhật + công cụ cơ bản
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Cài Docker + Docker Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Đăng xuất, đăng nhập lại để effect

# Kiểm tra
docker --version
docker compose version
```

### Mở firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Lấy source code lên server

```bash
# SSH vào server
ssh mkt@<IP-SERVER>

# Clone repo (giả sử dùng GitHub private repo + deploy key, hoặc dùng SCP)
cd ~
git clone git@github.com:<your-org>/khoahocsale.git
cd khoahocsale
```

> Nếu chưa có GitHub, có thể copy thủ công bằng SCP/rsync:
> ```bash
> # Từ máy Windows local (PowerShell):
> scp -r d:\VSCode\khoahocsale mkt@<IP-SERVER>:~/khoahocsale
> ```

---

## 3. Cấu hình biến môi trường

```bash
cd ~/khoahocsale
cp .env.production.example .env
nano .env
```

**Bắt buộc thay:**

| Biến | Cách lấy giá trị |
|---|---|
| `DOMAIN_NAME` | Domain thực tế, vd `academy.mktsoftware.vn` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (khác cái trên) |
| `OPENAI_API_KEY` | Key thật từ platform.openai.com — hoặc để mặc định để chạy STUB |
| `CORS_ORIGIN` | `https://<DOMAIN_NAME>` |
| `NEXT_PUBLIC_API_URL` | `https://<DOMAIN_NAME>/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<DOMAIN_NAME>` |

---

## 4. Cấu hình DNS

Vào nhà cung cấp domain (Namecheap/Cloudflare/Tenten/...), tạo:

| Type | Host | Value |
|---|---|---|
| A | `academy` (hoặc tên subdomain bạn chọn) | `<IP-SERVER>` |
| A | `www.academy` | `<IP-SERVER>` |

Đợi 5-10 phút để DNS propagate. Kiểm tra:
```bash
dig +short academy.mktsoftware.vn
# Phải trả về IP server
```

---

## 5. Lần đầu chạy — cấp HTTPS

Script `init-letsencrypt.sh` sẽ:
1. Khởi động nginx ở chế độ HTTP only
2. Gọi certbot xin cert
3. Bật HTTPS config và reload

```bash
chmod +x scripts/*.sh
./scripts/init-letsencrypt.sh
```

Nếu thành công, bạn thấy:
```
✅ Xong! Truy cập: https://academy.mktsoftware.vn
```

Cert sẽ tự gia hạn (container certbot kiểm tra mỗi 12h).

---

## 6. Khởi động lại đầy đủ (lần sau)

```bash
cd ~/khoahocsale
docker compose -f docker-compose.prod.yml up -d --build
```

Lệnh này sẽ:
- Build lại image API + Web nếu code đổi
- Migrate DB tự động (qua `prisma migrate deploy` trong ENTRYPOINT)
- Restart containers

Kiểm tra trạng thái:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api    # xem log API
docker compose -f docker-compose.prod.yml logs -f web    # xem log Web
```

---

## 7. Seed dữ liệu lần đầu

Database mới hoàn toàn rỗng — chạy seed để có tài khoản admin + sample data:

```bash
docker compose -f docker-compose.prod.yml exec api \
  sh -c "cd /app/apps/api && node -r ts-node/register prisma/seed.ts"
```

Hoặc nếu seed.ts đã build sẵn:
```bash
docker compose -f docker-compose.prod.yml exec api \
  npx ts-node --transpile-only /app/apps/api/prisma/seed.ts
```

Sau khi seed xong, đăng nhập bằng tài khoản admin (xem trong `apps/api/prisma/seed.ts`),
**đổi mật khẩu ngay** và tạo tài khoản HR/Manager thật.

---

## 8. Backup hằng ngày

Set cron job trên HOST (KHÔNG phải trong container):
```bash
crontab -e
```

Thêm dòng (chạy 2h sáng mỗi ngày, giữ 14 ngày):
```cron
0 2 * * * /home/mkt/khoahocsale/scripts/backup-db.sh >> /var/log/mkt-backup.log 2>&1
```

File backup được lưu ở `~/khoahocsale/backups/mkt-YYYYMMDD-HHMMSS.sql.gz`.

**Khuyên thêm**: copy backup ra cloud (rclone → Google Drive / S3) để tránh mất khi server hỏng đĩa.

### Restore khi cần
```bash
./scripts/restore-db.sh backups/mkt-20260523-020000.sql.gz
```

---

## 9. Update code (deploy bản mới)

Quy trình standard:
```bash
cd ~/khoahocsale
git pull origin main                                  # lấy code mới
docker compose -f docker-compose.prod.yml build       # build lại image
docker compose -f docker-compose.prod.yml up -d       # restart smooth
docker image prune -f                                  # dọn image cũ
```

Downtime: ~10-30 giây (lúc container restart). Nếu muốn zero-downtime sau này,
cần thêm health check + rolling update — chưa cần ở giai đoạn 50-500 user.

---

## 10. Monitoring + xử lý sự cố

### Xem log realtime
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=200 api
docker compose -f docker-compose.prod.yml logs -f --tail=200 web
docker compose -f docker-compose.prod.yml logs -f --tail=200 nginx
```

### Kiểm tra tài nguyên
```bash
docker stats                # CPU/RAM mỗi container
df -h                        # dung lượng đĩa
```

### Restart 1 service
```bash
docker compose -f docker-compose.prod.yml restart api
```

### Vào shell container (debug)
```bash
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U mkt_admin mkt_academy
```

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân + Fix |
|---|---|
| `502 Bad Gateway` | Container API/Web chưa start. Check `docker compose ps` + log. |
| Cert SSL hết hạn | Certbot auto-renew. Force renew: `docker compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal` |
| Database connection refused | Postgres container chưa healthy. Đợi 30s sau khi `up -d`. |
| `Out of memory` khi build | RAM server thấp. Thêm swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| WebSocket (Socket.io) không connect | Kiểm tra nginx config có block `location /socket.io/` với upgrade headers (đã có sẵn) |

---

## 11. Checklist sau deploy

- [ ] Truy cập `https://<domain>` thấy landing page
- [ ] Đăng nhập admin OK
- [ ] **ĐỔI MẬT KHẨU admin** ngay (mặc định trong seed.ts là yếu)
- [ ] Tạo 1 user test, tự đăng nhập → vào dashboard không lỗi
- [ ] Test AI Coach (nếu có OPENAI_API_KEY)
- [ ] Test realtime: mở leaderboard ở 2 tab → cập nhật khi 1 user complete quiz
- [ ] Backup cron đã chạy đêm đầu tiên (kiểm tra `~/khoahocsale/backups/`)
- [ ] Setup monitoring: ít nhất cài UptimeRobot ping `https://<domain>` mỗi 5 phút
- [ ] Lưu file `.env` ra nơi an toàn (1Password / vault) — file này chứa secret

---

## 12. Bảo mật (must-do)

1. **Disable root SSH**: chỉnh `/etc/ssh/sshd_config` → `PermitRootLogin no`, restart sshd
2. **SSH key only** (no password): `PasswordAuthentication no`
3. **Đổi default SSH port** (vd 22 → 2222), update ufw
4. **Tự động update security patch**:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```
5. **Fail2ban** chặn brute-force:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```
6. **Định kỳ** rotate `JWT_*_SECRET` (mỗi 3-6 tháng) — sẽ logout toàn bộ user.

---

## 13. Quy mô lớn hơn (500+ user) — khi nào nâng cấp

Stack hiện tại đủ cho 50-500 user. Khi tới ngưỡng:

- **DB > 70% CPU sustained** → tách Postgres ra server riêng, hoặc dùng managed (Supabase/Neon)
- **API > 70% CPU** → scale horizontal: chạy 2-3 instance API + load balancer (Nginx upstream)
- **Video traffic lớn** → chuyển sang CDN (Cloudflare Stream, Mux) thay vì link YouTube
- **>2000 user** → thay socket.io với Redis adapter để scale realtime

---

## Phụ lục: File structure tạo ra cho deploy

```
khoahocsale/
├── apps/
│   ├── api/Dockerfile         ← API container
│   └── web/Dockerfile         ← Web container
├── nginx/
│   ├── conf.d/
│   │   ├── app.conf           ← HTTPS config (production)
│   │   └── app.http-only.conf ← HTTP only (cấp cert lần đầu)
│   └── certbot/               ← Let's Encrypt certs (tự tạo)
├── scripts/
│   ├── init-letsencrypt.sh    ← cấp cert lần đầu
│   ├── backup-db.sh           ← backup daily
│   └── restore-db.sh          ← restore khi cần
├── backups/                   ← thư mục chứa file dump (tự tạo)
├── docker-compose.prod.yml    ← orchestration production
├── .env.production.example    ← template env
├── .env                       ← env thật (KHÔNG commit)
├── .dockerignore
└── DEPLOY.md                  ← file này
```
