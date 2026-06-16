# MKT Academy

> Nền tảng đào tạo nhân sự dạng **game hóa** — *Gamified Learning & HR Journey Platform*
> Sản phẩm nội bộ của **Phần mềm MKT** (phanmemmkt.vn / mktsoftware.vn).

**Phạm vi MVP:** đào tạo nhân sự Phòng Sales (xem `MKT_Academy_Spec_MVP_Sales.md`).

---

## 1. Tech stack

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| Frontend | **Next.js 14** (App Router) + TypeScript + TailwindCSS + Framer Motion | Giao diện game-style, SSR, animation |
| Backend | **NestJS 10** + TypeScript + Passport JWT | API, nghiệp vụ, phân quyền |
| Database | **PostgreSQL 16** | Lưu user, khóa học, kết quả, EXP |
| ORM | **Prisma 5** | Schema-first, type-safe queries |
| Realtime | **Socket.io 4** | Leaderboard realtime, notifications |
| AI | **OpenAI SDK** (gpt-4o-mini) | AI Coach + chấm tình huống & Boss Battle |
| Excel | **ExcelJS** | Xuất báo cáo nhiều sheet |
| Test | **Jest + Supertest** | E2E cho 5 luồng nghiệp vụ |
| Monorepo | **npm workspaces** | apps/web + apps/api + packages/types |

## 2. Cấu trúc dự án

```
khoahocsale/
├── apps/
│   ├── web/                    # Frontend Next.js (port 3004)
│   │   ├── app/                # Route App Router
│   │   │   ├── login/          # Đăng nhập
│   │   │   ├── onboarding/     # Khởi tạo nhân vật (avatar + tên)
│   │   │   └── dashboard/      # Khu vực sau đăng nhập
│   │   │       ├── learn/      # Cây khóa học + lesson + quiz CTA
│   │   │       ├── quiz/       # Trang làm bài thi + Boss Battle theme
│   │   │       ├── ai-coach/   # Chat luyện tập với AI
│   │   │       ├── leaderboard, badges, certificates
│   │   │       └── admin/      # 14 trang quản trị (ADMIN only)
│   │   ├── components/         # UI components + admin form components
│   │   ├── lib/                # API client + types + audio + avatars
│   │   └── tailwind.config.ts  # Design tokens MKT
│   └── api/                    # Backend NestJS (port 4000)
│       ├── src/
│       │   ├── auth/           # JWT login/refresh + Guards + Roles
│       │   ├── users/          # CRUD user + setup-character
│       │   ├── learning/       # Courses/lessons + lesson_progress
│       │   ├── quiz/           # Quiz + grading (sync + AI)
│       │   ├── ai/             # OpenAI service + Coach + chấm tình huống
│       │   ├── gamification/   # Central EXP + Level + ExpRules
│       │   ├── streak, badge, mission, certificate
│       │   ├── leaderboard/    # + Socket.io gateway
│       │   ├── profile/        # Dashboard data aggregator
│       │   └── admin/          # 4 controller admin
│       ├── prisma/
│       │   ├── schema.prisma   # 22+ bảng
│       │   └── seed.ts         # Sales course + 22 câu hỏi + 6 quiz + 9 badge
│       └── test/
│           └── app.e2e-spec.ts # E2E tests 5 luồng chính
├── packages/
│   └── types/                  # TypeScript types/enums dùng chung FE+BE
├── docker-compose.yml          # PostgreSQL local
├── .env.example                # Mẫu biến môi trường
└── MKT_Academy_Spec_MVP_Sales.md  # Tài liệu đặc tả gốc
```

## 3. Yêu cầu môi trường

- **Node.js** ≥ 20.x ([nodejs.org](https://nodejs.org/))
- **npm** ≥ 10.x (đi kèm Node)
- **Docker Desktop** (để chạy PostgreSQL local — [docker.com](https://www.docker.com/products/docker-desktop/))
- **OpenAI API key** (tùy chọn — không có vẫn chạy được nhờ STUB MODE)

## 4. Cài đặt lần đầu

```powershell
# 1) Cài dependency toàn monorepo
npm install

# 2) Sao chép file biến môi trường
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux

# 3) Khởi động PostgreSQL
npm run db:up

# 4) Tạo schema + migrate
npm run db:migrate -- --name init

# 5) Nạp seed (Sales course + 22 câu hỏi + 6 quiz + 9 badge + 3 mission + 3 tài khoản)
npm run db:seed
```

> `db:migrate` tự gọi `prisma generate` để sinh Prisma Client.

## 5. Chạy dev

```powershell
# Cả frontend + backend song song
npm run dev

# Hoặc riêng
npm run dev:api    # API: http://localhost:4000/api/v1
npm run dev:web    # Web: http://localhost:3004
```

**Truy cập:**
- 🌐 Web: <http://localhost:3004>
- 🔌 API health: <http://localhost:4000/api/v1/health>
- 🛢️ Prisma Studio: `npm run db:studio` → <http://localhost:5555>

## 6. Tài khoản test (sau khi `db:seed`)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `phamtuan91yb@gmail.com` | `VietNam2025@` |
| Manager Sales | `manager.sales@mkt.local` | `Mkt@12345` |
| Learner Sales | `learner.sales@mkt.local` | `Mkt@12345` |

## 7. Biến môi trường

File `.env` ở **thư mục gốc**. Mọi biến đều có trong [.env.example](.env.example):

### Database
| Biến | Mô tả | Mặc định |
|---|---|---|
| `POSTGRES_USER` | User Postgres | `mkt_admin` |
| `POSTGRES_PASSWORD` | Mật khẩu | `mkt_password_dev` |
| `POSTGRES_DB` | Tên database | `mkt_academy` |
| `POSTGRES_PORT` | Port docker map | `5432` |
| `DATABASE_URL` | Connection string Prisma | `postgresql://mkt_admin:mkt_password_dev@localhost:5432/mkt_academy?schema=public` |

### Backend
| Biến | Mặc định | Ghi chú |
|---|---|---|
| `API_PORT` | `4000` | |
| `API_HOST` | `0.0.0.0` | |
| `NODE_ENV` | `development` | |
| `CORS_ORIGIN` | `http://localhost:3004` | Phân cách bằng dấu phẩy cho nhiều origin |

### JWT — BẮT BUỘC đổi khi production
| Biến | Mô tả |
|---|---|
| `JWT_ACCESS_SECRET` | Chữ ký access token (≥ 32 ký tự) |
| `JWT_REFRESH_SECRET` | Chữ ký refresh token |
| `JWT_ACCESS_EXPIRES_IN` | TTL access — mặc định `15m` |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh — mặc định `7d` |

### OpenAI
| Biến | Mô tả |
|---|---|
| `OPENAI_API_KEY` | API key thật. Để placeholder `sk-replace...` → chạy STUB MODE |
| `OPENAI_MODEL` | Model — mặc định `gpt-4o-mini` |
| `OPENAI_MAX_TOKENS` | Giới hạn output — mặc định `1500` |
| `OPENAI_DAILY_LIMIT_PER_USER` | Lượt AI / người / ngày — mặc định `20` |

### Frontend
| Biến | Mô tả |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL API — mặc định `http://localhost:4000` |
| `NEXT_PUBLIC_SOCKET_URL` | URL Socket.io — mặc định `http://localhost:4000` |

## 8. Lệnh tiện ích

```powershell
# Database
npm run db:up                          # Khởi động Postgres
npm run db:down                        # Tắt (giữ data)
npm run db:migrate -- --name X         # Migration mới
npm run db:seed                        # Nạp lại seed (idempotent)
npm run db:studio                      # Prisma Studio

# Test E2E
npm run test --workspace=@mkt-academy/api

# Build production
npm run build                          # Build types + api + web

# Code quality
npm run lint --workspace=@mkt-academy/api
```

## 9. Design System MKT

Tham chiếu spec mục 8. Tokens tại [tailwind.config.ts](apps/web/tailwind.config.ts):

| Token | Hex | Vai trò |
|---|---|---|
| `navy-deep` | `#0D47A1` | Khối 3D, đầu gradient |
| `navy` | `#1565C0` | Nền chính |
| `blue` | `#1E88E5` | Nền phụ |
| `sky` | `#64B5F6` | Nền nhạt + glow viền |
| `ice` | `#B3E5FC` | Surface sáng |
| `orange` | `#FF8C00` | CTA, EXP, cảnh báo |
| `gold` | `#FFD700` | Điểm/KPI/Badge |
| `pink` | `#FF4081` | Streak/lửa |

**Gradient nền chuẩn** (class `bg-mkt-gradient`):
```css
linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #1E88E5 80%, #64B5F6 100%)
```

**Component utility** (trong [globals.css](apps/web/app/globals.css)):
- `.mkt-card` — kính mờ glow xanh
- `.mkt-btn-primary` / `.mkt-btn-secondary` — pill cam / viền sky
- `.mkt-pill-navy/orange/gold` — pill số liệu
- `.mkt-exp-track` / `.mkt-exp-fill` — thanh EXP shine animation
- `.mkt-badge` — huy hiệu phát sáng vàng
- `.mkt-input` — input chuẩn admin form

**Nguyên tắc bất di bất dịch:**
1. Nền **không bao giờ** dùng màu trắng.
2. Heading IN HOA, font `font-display` ExtraBold.
3. Mọi action có phản hồi < 300ms (Framer Motion + Web Audio API SFX).
4. Chữ hiển thị bằng tiếng Việt có dấu đầy đủ.

## 10. Triển khai production

### Database
- Dùng Postgres managed (Supabase, Neon, AWS RDS, DigitalOcean).
- `DATABASE_URL` với SSL: `?sslmode=require`.
- Deploy migration: `npx prisma migrate deploy` (KHÔNG dùng `migrate dev`).

### Backend API
- Build: `npm run build:api` → output tại `apps/api/dist/main.js`
- Reverse proxy (Nginx/Caddy) → port 4000.
- **Quan trọng:** proxy phải hỗ trợ WebSocket upgrade cho Socket.io.
- Process manager: PM2, Docker, hoặc systemd.

### Frontend Web
- Build: `npm run build:web` → output `apps/web/.next`
- Lựa chọn:
  - **Vercel**: connect repo, set `NEXT_PUBLIC_API_URL` trỏ về API prod
  - **Tự host**: `npm run start --workspace=@mkt-academy/web` (port 3004)

### Deploy production
- `docker-compose.vps.yml`: mo hinh VPS dung sau reverse proxy ngoai (Caddy/Nginx host)
- `docker-compose.standalone.yml`: mo hinh standalone legacy, project tu xu ly `nginx` + `certbot`

### Bắt buộc thay khi production
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — random ≥ 32 ký tự
- `OPENAI_API_KEY` — key thật
- `DATABASE_URL` — Postgres managed có SSL
- `CORS_ORIGIN` — domain web prod
- `NEXT_PUBLIC_API_URL` — HTTPS

### Sau deploy
1. Chạy migrate 1 lần: `npx prisma migrate deploy`
2. Tạo tài khoản Admin gốc qua Prisma Studio hoặc sửa seed
3. Bật rate-limit reverse proxy, force HTTPS, set `Secure` cookie
4. Theo dõi log + metrics (Sentry / Datadog / OpenTelemetry)

## 11. Tiến độ Sprint

| Sprint | Phạm vi | Trạng thái |
|---|---|---|
| 0 | Khởi tạo monorepo, schema, brand tokens | ✅ |
| 1 | Auth JWT + 3 vai trò + Onboarding nhân vật | ✅ |
| 2 | Khu vực học — cây 5 mô-đun Sales | ✅ |
| 3 | Quiz 3 dạng + EXP/Level + Boss Battle | ✅ |
| 4 | Gamification — Dashboard + Leaderboard realtime + Badge + Mission + Certificate | ✅ |
| 5 | AI Coach 4 kịch bản + AI chấm tình huống | ✅ |
| 6 | Admin Dashboard — tự nhập 100% nội dung | ✅ |
| 7 | Hoàn thiện — Mobile responsive + E2E tests + README | ✅ |

### Tính năng đã ship
- ✅ Auth JWT (access 15m + refresh 7d rotation), 3 vai trò + RolesGuard
- ✅ Onboarding chọn avatar + tên hiển thị
- ✅ Cây khóa học Sales 5 mô-đun, 15 bài học có nội dung thực tế
- ✅ Cơ chế khóa/mở khóa mô-đun theo tiến độ
- ✅ Quiz 3 dạng (MC, tình huống AI chấm, mini-game kéo-thả) + Boss Battle Level 1
- ✅ Vòng lặp Học→Quiz→EXP→Level Up→Reward→Leaderboard→Unlock liền mạch
- ✅ Dashboard cá nhân đầy đủ thành phần spec 5.2
- ✅ Leaderboard 3 board × 3 period + realtime qua Socket.io
- ✅ Daily Mission auto-detect hoàn thành + EXP reward + Streak update
- ✅ 7 rule type cho Badge + auto award sau mỗi event
- ✅ Certificate điện tử auto-issue + in PDF qua window.print
- ✅ AI Coach 4 kịch bản + STUB mode (chạy không cần API key)
- ✅ AI chấm tình huống theo 3 tiêu chí (thái độ/logic/SOP)
- ✅ Admin Dashboard 14 trang — CRUD đầy đủ + xuất Excel
- ✅ Bảng quy đổi EXP cấu hình động (ExpRule table)
- ✅ E2E tests 5 luồng chính
- ✅ Mobile responsive sidebar + drawer
- ✅ Error boundary + 404 page với brand styling

### Risk còn lại (chuyển sang post-MVP)
Xem báo cáo Sprint 7.

---

*Chủ đầu tư: **Phạm Tuân** — CEO Phần mềm MKT — phanmemmkt.vn / mktsoftware.vn*
