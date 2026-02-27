FROM oven/bun:1.3.9
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/rds/package.json packages/rds/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
COPY packages/worker/package.json packages/worker/
COPY packages/cron/package.json packages/cron/
COPY packages/site/package.json packages/site/
RUN bun install
COPY packages/rds/ packages/rds/
COPY packages/worker/ packages/worker/
CMD ["bun", "run", "packages/worker/src/index.ts"]
