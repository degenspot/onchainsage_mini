## Backend & Data Wrap-up Plan

### Objectives
- Replace mocks with real data via Prisma and Redis/BullMQ.
- Deliver promised REST/WS API: signals, prophecies, health.
- Stand up worker ingestion, scoring, and (stub) prophecy pipeline.

---

### Milestone 1 — Read Models in API (Prisma)
1) Add Prisma client to `apps/api` and wire a `ReadModelModule`:
   - `ReadModelService` with methods:
     - `getTopSignals({ window, limit })` — join latest `Signal` per `Token` in range.
     - `getTokenSignals(chain, address, { limit })` — recent `Signal[]` for `tokenId`.
     - `getTodayProphecies()` — `Prophecy` rows for current UTC day with `Token`.
2) Update `SignalsController` to call service instead of mocks.
3) Add DTOs and validation (Nest pipes) for query params.

Deliverables:
- `apps/api/src/read-model/read-model.module.ts`
- `apps/api/src/read-model/read-model.service.ts`
- Replace `signals.controller.ts` mock with service calls.

---

### Milestone 2 — REST Endpoints
1) Signals
   - `GET /signals/top?window=24h&limit=5` → from `ReadModelService.getTopSignals`.
   - `GET /signals/:chain/:address` → from `ReadModelService.getTokenSignals`.
2) Prophecies
   - `GET /prophecies/today` → from `ReadModelService.getTodayProphecies`.
3) Health
   - `GET /health` → returns `{ ok: true, db: 'ok', redis: 'ok' }`.

Deliverables:
- `apps/api/src/prophecies/prophecies.controller.ts`
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.controller.ts`

---

### Milestone 3 — WebSocket from Real Data
1) Replace random interval with pub/sub driven events:
   - Use Redis pub/sub channel `signals:live`.
   - Worker publishes `{tokenId, score, label, at}` when new `Signal` stored and beats threshold.
2) Gateway subscribes on `afterInit` and relays messages to connected clients.

Deliverables:
- Update `apps/api/src/signals/signals.gateway.ts` to subscribe to Redis.
- Add `RedisModule` (simple provider creating a Redis client from `REDIS_URL`).

---

### Milestone 4 — Redis/BullMQ Integration
1) Add Upstash/Redis env wiring (`REDIS_URL`).
2) In `apps/worker`, create BullMQ queues:
   - `social`, `market`, `score`, `prophecy`.
3) Add producers in schedulers (Nest `@Cron` or `@Interval`) to enqueue ingestion jobs.
4) Add processors to fetch and persist snapshots, then enqueue scoring.

Deliverables:
- `apps/worker/src/queues/bull.module.ts` (Queue + Worker providers)
- `apps/worker/src/ingest/ingest.module.ts`
- `apps/worker/src/ingest/market.processor.ts`
- `apps/worker/src/ingest/social.processor.ts`
- `apps/worker/src/scoring/scoring.module.ts`
- `apps/worker/src/scoring/scoring.processor.ts`
- `apps/worker/src/prophecy/prophecy.module.ts`
- `apps/worker/src/prophecy/prophecy.scheduler.ts`

---

### Milestone 5 — Connectors (DexScreener + Social Stub)
1) Create minimal `packages/connectors`:
   - `market/DexScreenerProvider` → fetch pairs by trending or by token address; map to `{chainId,address,price,volume1h,volume24h,liquidity_usd,age_minutes}`.
   - `social/TrendingProvider` → stub returning deterministic counts for a symbol list (replace later with real source).
2) Version them as simple TypeScript modules consumed by worker.

NOTE: Follow-up (deferred)
- Replace social stub with a real provider (e.g., LunarCrush free/community API).
- Add `LUNARCRUSH_KEY` to env; respect rate limits; map to `SocialSnapshot`.

Deliverables:
- `packages/connectors/market/dexscreener.ts`
- `packages/connectors/social/trending.ts`
- `packages/connectors/index.ts`

---

### Milestone 6 — Scoring Engine (Deterministic)
1) Create `packages/scoring` with `SignalEngine` per spec:
   - Input merges latest market + social for a token.
   - Output `{ score, label, reasons }` using deterministic formula and thresholds.
2) Worker `scoring.processor` reads recent snapshots, computes `Signal`, persists, and publishes Redis `signals:live` if score > threshold.

Deliverables:
- `packages/scoring/index.ts`
- `apps/worker/src/scoring/scoring.processor.ts` (uses engine)

---

### Milestone 7 — Prophecy Pipeline (MVP)
1) `ProphecyScheduler` (daily UTC 12:00):
   - Query top N signals in last 24h via Prisma.
   - Insert `Prophecy` rows with `signalHash` and rank; leave `txHash` null for now.
   - Publish summary to Redis `prophecies:today` (optional for UI).
2) Later: integrate EVM adapter and chain posting.

Deliverables:
- `apps/worker/src/prophecy/prophecy.scheduler.ts`

---

### Environment Variables
Add to root `.env.example` and app-specific `.env`:
```
DATABASE_URL=
REDIS_URL=
DEXSCREENER_BASE=https://api.dexscreener.com/latest/dex
FRONTEND_ORIGIN=
```

---

### Minimal Data Contracts (Types)
- Shared types in `packages/shared` (optional for MVP; else duplicate where used):
  - `ApiSignal`, `ScoreInput`, `ScoreOutput`, `MarketSnapshotDTO`, `SocialSnapshotDTO`.

---

### Acceptance Checklist
- `GET /signals/top` returns DB-backed results.
- `GET /signals/:chain/:address` returns recent DB signals for token.
- `GET /prophecies/today` returns today’s `Prophecy` rows.
- `GET /health` returns `ok` with DB and Redis checks.
- WebSocket pushes real signals from Redis pub/sub.
- Worker enqueues ingest and scoring on schedule and persists snapshots and signals.

---

### Execution Order (1-week path)
Day 1: Milestone 1 (Read models) + Milestone 2 (REST) + Health.
Day 2: Milestone 4 (Redis/BullMQ base) + API WS subscription.
Day 3: Milestone 5 (DexScreener connector) + Market ingest processor.
Day 4: Milestone 6 (Scoring engine + processor) + WS live events.
Day 5: Social stub + merge in scoring inputs; refine thresholds.
Day 6: Milestone 7 (Prophecy scheduler) + simple listing endpoint done.
Day 7: Hardening, envs, docs, small E2E sanity run.

---

### Notes on Testing
- Add a seed script to insert a few `Token` and snapshot rows; verify API/WS end-to-end.
- For processors, unit-test mapping from connector output to Prisma models.

## Status Snapshot (2025-09-04)

- Core read-model schema and migrations present under `apps/api/prisma`.
- `db:sync` helper added to `apps/api` for smoother local sync: `prisma migrate deploy && prisma generate && npm run prisma:seed`.

Direction: finish Worker -> Redis publishing stability, add end-to-end test that seeds DB, runs worker, and verifies a live WS message via API.


