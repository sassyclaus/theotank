# Pre-Launch Improvements

Beta readiness assessment for TheoTank, conducted March 2026.

---

## Overall Verdict: READY FOR CLOSED BETA WITH CAVEATS

The core product functionality is solid: auth works, the deliberation tools function end-to-end, the theologian corpus is seeded, the waitlist system exists. The main gaps are operational (no CI/CD, no error tracking, no tests) and a few security hardening items. None are blockers for a small closed beta, but several should be addressed before wider distribution.

---

## What's Working Well

### Core Product
- **All main pages functional**: Home, Theologians (list + detail + filters), Roundtable (Ask + Poll tools), Library (My + Explore), Result detail views with progress tracking, Research page
- **Auth flow solid**: Clerk JWT on frontend + backend, auto sign-out on 401, admin role verification
- **Worker pipeline reliable**: Postgres-based job queue with `FOR UPDATE SKIP LOCKED`, stale lock recovery, graceful shutdown, OpenAI rate-limit handling with `Retry-After` support
- **376 theologians seeded** with bios, taglines, voice styles, key works
- **Usage tier system**: Rolling 30-day limits per tool type, returns 429 with limit details
- **Team snapshots**: Immutable captures prevent data drift on result creation
- **Real-time progress**: `resultProgressLogs` table + polling endpoint for job tracking
- **Waitlist system**: Signup, queue position, referral codes, UTM tracking, persona/tool segmentation
- **Structured logging**: Pino with request IDs, duration tracking, error-level differentiation
- **Responsive design**: Consistent 768px breakpoint, mobile hamburger menu, touch-friendly sizing

### Infrastructure
- **Deployment path exists**: Railway (API/worker/cron) + Cloudflare Pages (web/site), Makefile orchestration
- **CORS properly configured**: Env-var driven origins
- **Health endpoints**: API and worker both expose `/health`
- **S3/R2 object storage**: Clean bucket layout, presigned URLs for admin uploads
- **Database schema well-designed**: 17 tables, proper foreign keys, full-text + semantic search indexes

---

## Critical Issues (Fix Before Any Beta)

### 1. No React Error Boundary

Any unhandled component error crashes the entire app to a white screen. No error boundary components exist anywhere in `packages/web/`.

**Fix**: Add an error boundary around the main `<Layout />` and around admin routes.

### 2. Waitlist Token Secret Has Hardcoded Fallback

`packages/api/src/routes/public/waitlist.ts` — `const secret = process.env.WAITLIST_TOKEN_SECRET || "waitlist-dev-secret"`. If the env var isn't set in production, anyone can forge confirmation tokens.

**Fix**: Make it a required env var (throw on startup if missing).

### 3. No Rate Limiting on API

No protection against abuse. A single user or bot could hammer the API. Usage-tier limits exist (per-user monthly caps), but there's no IP-level rate limiting.

**Fix**: Add Hono rate-limiting middleware (e.g., 100 req/min per IP).

### 4. Waitlist Email Confirmation Not Implemented

`packages/api/src/routes/public/waitlist.ts` — `// TODO: Send confirmation email`. Token generation is implemented but emails aren't sent. The waitlist can be filled with fake emails.

**Fix**: Integrate an email service (Resend, SendGrid) and send confirmation links. Alternatively, remove the confirmation flow and accept unverified signups for initial beta.

---

## High Priority (Fix Before Public/Open Beta)

### 5. Zero Tests

No test files exist in any package. No test runner configured. For a closed beta with limited users this is acceptable but risky. Before wider release, at minimum add tests for: job processing pipeline, API auth middleware, result creation flow, usage limit enforcement.

### 6. No CI/CD Pipeline

No `.github/` directory. Deployment is manual via `make deploy-all`. Risk of deploying broken code. At minimum: GitHub Actions workflow that runs `tsc -b` on PRs.

### 7. No Error Tracking Service

Only console/Pino logging. No Sentry, DataDog, or equivalent. In production, errors will be invisible unless someone checks Railway logs manually. For a closed beta you can get by with Railway log tailing, but set up Sentry before scaling.

### 8. No Runtime Input Validation

API uses TypeScript types (`c.req.json<T>()`) but no runtime validation (no zod/joi). Admin endpoints accept `Record<string, unknown>` without validation. Frontend forms have minimal validation (required fields checked, but no length limits, no format validation). Risk: malformed data in the database, potential for unexpected errors.

### 9. Worker Stale Lock Timeout Too Long

Currently 2 hours (`WORKER_STALE_LOCK_THRESHOLD_MS`). If a worker crashes mid-job, users see a "stuck" result for up to 2 hours. Reduce to 10-15 minutes for beta.

### 10. OpenAI Call Timeout Not Set

Worker has `maxRetries: 5` but no explicit timeout. A stuck OpenAI call can hang indefinitely. Add a 60s timeout per call.

### 11. No Legal Pages

No Terms of Service, Privacy Policy, or cookie consent. The waitlist collects emails and stores user-submitted questions. This needs at minimum a privacy policy before launch.

---

## Medium Priority (Address During Beta)

| # | Issue | Details |
|---|-------|---------|
| 12 | **No `.dockerignore`** | Docker images include unnecessary files (`.git`, `node_modules`), bloating build size |
| 13 | **OpenAI SDK version mismatch** | API uses v6.25.0, worker uses v4.85.0 — should align to latest |
| 14 | **Missing error UI in Library** | `MyLibraryView` has `// Error is surfaced by React Query` comment but no error UI |
| 15 | **No invite system** | Waitlist collects users but no mechanism to send beta invites |
| 16 | **No feature flags** | No way to toggle features for beta users vs general population |
| 17 | **Worker health check not in Railway config** | Worker has `/health` endpoint but `railway.json` doesn't configure it |
| 18 | **Admin form validation gaps** | Theologian editor accepts any input without length/format checks |
| 19 | **S3 upload retry** | No retry logic on S3 uploads — if upload fails, entire job fails |
| 20 | **Connection pool not tuned** | Default postgres.js pool (10 connections), no idle timeout config |
| 21 | **No database backup documentation** | Relies on Railway's managed backups but this isn't verified or documented |

---

## Low Priority (Post-Beta Polish)

| # | Issue |
|---|-------|
| 22 | Skip-to-content accessibility link |
| 23 | ARIA labels on search inputs |
| 24 | Combine small database migrations |
| 25 | Add missing indexes (`results.theologianId`, `results.completedAt`) |
| 26 | Document all environment variables in `.env.example` |
| 27 | Production deployment runbook |
| 28 | Multi-region failover strategy |

---

## Package-Level Summary

| Package | Status | Key Gap |
|---------|--------|---------|
| **web** | Production-quality UI, good loading states, responsive | No error boundary, minimal form validation |
| **api** | All endpoints implemented, auth solid, logging good | No rate limiting, no runtime input validation |
| **rds** | Schema well-designed, migrations clean | Missing a few indexes, pool not tuned |
| **worker** | Job queue robust, OpenAI handling good | No timeout config, 2hr stale lock too long |
| **cron** | Functional | S3 validation only in Railway env |
| **infra** | Railway + Cloudflare Pages works | No CI/CD, no error tracking, no backup docs |

---

## Recommended Launch Sequence

### Phase 1: Pre-Launch Hardening (Do Now)
1. Add React error boundary (prevent white-screen crashes)
2. Make `WAITLIST_TOKEN_SECRET` required (no fallback)
3. Add API rate limiting middleware
4. Implement waitlist email confirmation (or accept unverified signups for now)
5. Add a basic privacy policy page
6. Reduce worker stale lock timeout to 15 minutes

### Phase 2: Closed Beta Launch
- Invite 10-20 users manually via email
- Monitor Railway logs for errors
- Collect feedback on core Ask/Poll workflow

### Phase 3: During Closed Beta
7. Set up Sentry for error tracking
8. Add GitHub Actions CI (at least type-checking)
9. Add zod validation on critical API endpoints (result creation, team CRUD)
10. Add OpenAI call timeout
11. Build invite system for waitlist conversion

### Phase 4: Open Beta Preparation
12. Comprehensive test suite for critical paths
13. Legal pages (ToS, full privacy policy)
14. Feature flags for gradual rollout
15. Database backup verification
16. Production monitoring dashboard
