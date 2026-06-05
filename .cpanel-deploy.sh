#!/bin/sh
set -eu

export PATH="/opt/alt/alt-nodejs20/root/usr/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
export CI=1
export RAYON_NUM_THREADS=1
export SWC_THREADS=1
export NEXT_PRIVATE_BUILD_WORKER=1

BASE="/home/wghk7piw6ajn/daotao.nhansuchat.vn"
LOG="$BASE/logs/deploy.log"
RELEASE="$BASE/app.release"
CURRENT="$BASE/app"
STAMP="$(date +%Y%m%d%H%M%S)"

mkdir -p "$BASE/logs" "$BASE/uploads"
rm -rf "$RELEASE"
mkdir -p "$RELEASE"

echo "[$(date)] Extract source"
tar -xzf "$BASE/source.tar.gz" -C "$RELEASE"

if [ -f "$CURRENT/.env" ]; then
  cp "$CURRENT/.env" "$RELEASE/.env"
fi
cp "$RELEASE/server.cpanel.js" "$RELEASE/server.js"

cd "$RELEASE"
echo "[$(date)] Node: $(node -v)"
echo "[$(date)] NPM: $(npm -v)"

npm install --include=dev
npm run build --workspace=@mkt-academy/types
npm run prisma:generate --workspace=@mkt-academy/api
npm run build --workspace=@mkt-academy/web

if [ -d "$CURRENT" ]; then
  mv "$CURRENT" "$BASE/app.prev.$STAMP"
fi
mv "$RELEASE" "$CURRENT"

echo "[$(date)] Deploy complete"
