# =====================================================
# MKT Academy — Dockerfile cho API (NestJS)
# Multi-stage build: builder → runner
# =====================================================

# ---------- STAGE 1: builder ----------
FROM node:20-alpine AS builder
WORKDIR /repo

# Cài openssl cho prisma
RUN apk add --no-cache openssl

# Copy lockfile + workspace manifest trước để cache layer install
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/

# Cài tất cả dependencies (cả dev — cần để build)
RUN npm install --ignore-scripts

# Copy source
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Build shared package trước để runtime trong container không phải load TS source
WORKDIR /repo/packages/types
RUN npm run build

# Generate Prisma client + build NestJS
WORKDIR /repo/apps/api
RUN npx prisma generate
RUN npm run build

# ---------- STAGE 2: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl tini

ENV NODE_ENV=production

# Workspace dùng node_modules hoist ở root, không có /apps/api/node_modules riêng.
# Runtime của Nest vẫn resolve được dependency qua /app/node_modules.
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/packages/types/package.json ./packages/types/package.json
COPY --from=builder /repo/packages/types/dist ./packages/types/dist

WORKDIR /app/apps/api

EXPOSE 4000

# Migrate deploy + seed (idempotent) + start
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
