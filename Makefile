.PHONY: deploy-api deploy-worker deploy-cron deploy migrate-prod

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Deploy API service to Railway
deploy-api:
	railway up --service api --detach

# Deploy Worker service to Railway
deploy-worker:
	railway up --service worker --detach

# Deploy Cron service to Railway
deploy-cron:
	railway up --service cron --detach

# Deploy all services
deploy:
	$(MAKE) deploy-api
	$(MAKE) deploy-worker
	$(MAKE) deploy-cron

# Run Drizzle migrations against production database
migrate-prod:
	@echo "Running migrations against production..."
ifndef DATABASE_PUBLIC_URL
	$(error DATABASE_PUBLIC_URL is not set. Get it from Railway Postgres service variables.)
endif
	DATABASE_URL=$(DATABASE_PUBLIC_URL) bun run packages/rds/src/migrate.ts
