#!/usr/bin/env bash

set -euo pipefail

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

npm ci
npm run prisma:generate
sudo npx playwright install --with-deps chromium
