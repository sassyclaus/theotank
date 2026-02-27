FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/rds/package.json packages/rds/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
COPY packages/worker/package.json packages/worker/
COPY packages/cron/package.json packages/cron/
RUN bun install --frozen-lockfile
COPY packages/rds/ packages/rds/
COPY packages/cron/ packages/cron/
CMD ["bun", "run", "packages/cron/src/index.ts"]
