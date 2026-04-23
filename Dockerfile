# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS base
WORKDIR /app
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG CONTAINER_TRUST_PROXY_CA=true
ARG CONTAINER_PROXY_CA_ENDPOINT=registry.npmjs.org:443
ENV NEXT_TELEMETRY_DISABLED=1
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}
ENV http_proxy=${HTTP_PROXY}
ENV https_proxy=${HTTPS_PROXY}
ENV no_proxy=${NO_PROXY}
ENV CONTAINER_TRUST_PROXY_CA=${CONTAINER_TRUST_PROXY_CA}
ENV CONTAINER_PROXY_CA_ENDPOINT=${CONTAINER_PROXY_CA_ENDPOINT}
ENV NODE_OPTIONS=--use-openssl-ca
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_CAFILE=/etc/ssl/certs/ca-certificates.crt
ENV NPM_CONFIG_FUND=false
COPY scripts/bootstrap-container-proxy-ca.mjs /usr/local/bin/bootstrap-container-proxy-ca.mjs
COPY docker/certs /tmp/container-extra-certs
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && node /usr/local/bin/bootstrap-container-proxy-ca.mjs \
  && if find /tmp/container-extra-certs -type f \( -name '*.crt' -o -name '*.pem' \) | grep -q .; then \
    find /tmp/container-extra-certs -type f \( -name '*.crt' -o -name '*.pem' \) -exec cp {} /usr/local/share/ca-certificates/ \;; \
  fi \
  && update-ca-certificates \
  && rm -rf /tmp/container-extra-certs

FROM base AS deps
COPY package.json package-lock.json prisma.config.mjs ./
COPY prisma ./prisma
RUN --mount=type=bind,source=vendor,target=/vendor,readonly \
  if [ -d /vendor/npm-offline-cache ]; then \
    cp -R /vendor/npm-offline-cache /tmp/npm-offline-cache \
    && npm ci --offline --cache /tmp/npm-offline-cache; \
  elif [ -f /vendor/npm-offline-cache.tar.gz ]; then \
    mkdir -p /tmp/npm-offline-cache \
    && tar -xzf /vendor/npm-offline-cache.tar.gz -C /tmp/npm-offline-cache \
    && npm ci --offline --cache /tmp/npm-offline-cache; \
  else \
    npm ci; \
  fi \
  && node -e "for (const mod of ['next/package.json', 'prisma/package.json', 'vitest/package.json']) require.resolve(mod)" \
  && test -x /app/node_modules/.bin/prisma \
  && if [ -d /vendor/prisma-client ]; then \
    mkdir -p /app/node_modules/.prisma \
    && cp -R /vendor/prisma-client/. /app/node_modules/.prisma/; \
  elif [ -f /vendor/prisma-client.tar.gz ]; then \
    mkdir -p /app/node_modules/.prisma \
    && tar -xzf /vendor/prisma-client.tar.gz -C /app/node_modules/.prisma; \
  else \
    npm run prisma:generate; \
  fi \
  && rm -rf /tmp/npm-offline-cache

FROM base AS test
ENV NODE_ENV=test
COPY package.json package-lock.json prisma.config.mjs /opt/onesource-test/
COPY prisma /opt/onesource-test/prisma
COPY --from=deps /app/node_modules /opt/onesource-test/node_modules
COPY . .

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start:compose"]

FROM base AS e2e-web
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

FROM mcr.microsoft.com/playwright:v1.59.1-noble AS playwright
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=test
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "e2e"]
