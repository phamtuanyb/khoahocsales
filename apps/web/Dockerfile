# =====================================================
# MKT Academy — Dockerfile cho Web (Next.js 14)
# Multi-stage build: deps → builder → runner
# =====================================================

# ---------- STAGE 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/

RUN npm install --ignore-scripts

# ---------- STAGE 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/tsconfig.base.json ./tsconfig.base.json
COPY packages/types ./packages/types
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build-time public env vars phải truyền vào lúc build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /repo/packages/types
RUN npm run build

WORKDIR /repo/apps/api
RUN npx prisma generate

WORKDIR /repo/apps/web
RUN npm run build

# ---------- STAGE 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /repo/packages/types/package.json ./packages/types/package.json
COPY --from=builder --chown=nextjs:nodejs /repo/packages/types/dist ./packages/types/dist

USER nextjs
EXPOSE 3004

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npx", "next", "start", "-p", "3004"]
