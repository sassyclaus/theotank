.PHONY: deploy-api deploy-worker deploy-cron deploy build-web deploy-web build-site deploy-site deploy-all migrate-prod

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# ── Railway services ──────────────────────────────────────────────

# Deploy API service to Railway
deploy-api:
	railway up --service API --detach

# Deploy Worker service to Railway
deploy-worker:
	railway up --service Worker --detach

# Deploy Cron service to Railway
deploy-cron:
	railway up --service Cron --detach

# Deploy all Railway services
deploy:
	$(MAKE) deploy-api
	$(MAKE) deploy-worker
	$(MAKE) deploy-cron

# ── Cloudflare Pages ─────────────────────────────────────────────

# Build web app (Vite SPA)
build-web:
	cd packages/web && bun run build

# Deploy web app to Cloudflare Pages
deploy-web: build-web
ifndef CLOUDFLARE_PROJECT_WEB
	$(error CLOUDFLARE_PROJECT_WEB is not set. Set it in .env or pass it as an argument.)
endif
	cd packages/web && npx wrangler pages deploy dist --project-name=$(CLOUDFLARE_PROJECT_WEB)

# Build marketing site (Astro)
build-site:
	cd packages/site && bun run build

# Deploy marketing site to Cloudflare Pages
deploy-site: build-site
ifndef CLOUDFLARE_PROJECT_SITE
	$(error CLOUDFLARE_PROJECT_SITE is not set. Set it in .env or pass it as an argument.)
endif
	cd packages/site && npx wrangler pages deploy dist --project-name=$(CLOUDFLARE_PROJECT_SITE)

# Deploy everything (Railway + Cloudflare)
deploy-all:
	$(MAKE) deploy
	$(MAKE) deploy-web
	$(MAKE) deploy-site

# ── Database ─────────────────────────────────────────────────────

# Run Drizzle migrations against production database
migrate-prod:
	@echo "Running migrations against production..."
ifndef PROD_DATABASE_PUBLIC_URL
	$(error PROD_DATABASE_PUBLIC_URL is not set. Get it from Railway Postgres service variables.)
endif
	DATABASE_URL=$(PROD_DATABASE_PUBLIC_URL) bun run packages/rds/src/migrate.ts
