FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
COPY apps/bun-worker/package.json ./apps/bun-worker/
COPY packages/db/package.json ./packages/db/
COPY packages/channel-sync/package.json ./packages/channel-sync/
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/bun-worker
RUN bun run build

FROM base AS runtime
COPY --from=build /app/apps/bun-worker/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER bun
CMD ["bun", "run", "./dist/index.js"]

