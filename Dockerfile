FROM oven/bun:1.2 AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install
RUN bun run build

FROM oven/bun:1.2-slim

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["bun", "apps/api/dist/index.js"]
