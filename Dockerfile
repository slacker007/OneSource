FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:compose"]
