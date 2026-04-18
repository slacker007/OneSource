FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY vendor ./vendor
RUN if [ -f vendor/npm-offline-cache.tar.gz ]; then \
    mkdir -p /tmp/npm-offline-cache \
    && tar -xzf vendor/npm-offline-cache.tar.gz -C /tmp/npm-offline-cache \
    && npm ci --offline --cache /tmp/npm-offline-cache; \
  else \
    npm ci; \
  fi \
  && if [ -f vendor/prisma-client.tar.gz ]; then \
    mkdir -p /app/node_modules/.prisma \
    && tar -xzf vendor/prisma-client.tar.gz -C /app/node_modules/.prisma; \
  else \
    npm run prisma:generate; \
  fi \
  && rm -rf /tmp/npm-offline-cache /app/vendor

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start:compose"]

FROM mcr.microsoft.com/playwright:v1.59.1-noble AS playwright
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=test
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "e2e"]
