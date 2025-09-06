# Worker & Packages — Overview and How it Works

Date: 2025-09-04

This document explains what the Worker app does, how the shared packages are used, where the key logic lives, and how to test/simulate locally. It is written to help developers quickly understand the behavior and to find the important files to inspect or modify.

---

## Quick checklist

- Map of responsibilities for each worker component — done
- Data flow and where prophecies/signals are created — done
- Key files to review and why — done
- Edge cases and suggested improvements — done
- How to simulate and debug locally — done

---

## One-line summary

The Worker ingests market and social data, computes scored Signals, publishes live signals via Redis, and runs a ProphecyScheduler that evaluates top signals (criteria + narrative + AI) and writes daily Prophecy rows which it publishes to Redis; shared packages implement scoring, criteria, narrative, and AI helpers.

## Where to look (important files)

- apps/worker/src/app.module.ts — module wired with providers: processors, scheduler, publisher, Prisma.
- apps/worker/src/scheduler/scheduler.service.ts — enqueues demo jobs to keep the pipeline busy in dev.
- apps/worker/src/ingest/market.processor.ts — MARKET_QUEUE worker; calls DexScreener, upserts Token, writes MarketSnapshot, enqueues social+score jobs.
- apps/worker/src/ingest/social.processor.ts — SOCIAL_QUEUE worker; currently a deterministic stub that writes SocialSnapshot.
- apps/worker/src/queues/signal.processor.ts — SIGNAL_QUEUE worker; runs SignalEngine, writes Signal, publishes `signals:live` to Redis when threshold met.
- apps/worker/src/publisher/mock-signal.publisher.ts — publishes mock signals (dev only) if Redis configured.
- apps/worker/src/prophecy/prophecy.scheduler.ts — core prophecy pipeline (criteria, narrative, AI thesis, persist Prophecy, publish `prophecies:today`).
- apps/worker/src/scoring/signal-engine.ts — heuristic score computation and label selection.
- packages/scoring/criteria-engine.ts — rule-based criteria sets (early-momentum, whale-activity, social-breakout).
- packages/narrative/narrative-analyzer.ts — narrative extraction (sentiment, themes, coherence).
- packages/ai/ai-provider.ts — RuleBasedProvider + OpenAIProvider stub; generates thesis text.
- apps/worker/src/connectors/dexscreener.ts — normalizes external market REST data into MarketSnap objects.

---

## High-level data flow

1. Scheduler or external producer enqueues jobs (market search, simulated scoring) via Bull queues.
2. MarketProcessor fetches pairs from DexScreener, upserts `Token`, writes `MarketSnapshot`, enqueues a social job and a scoring job for each pair.
3. SocialProcessor writes `SocialSnapshot` (stubbed now).
4. SignalProcessor merges latest social snapshot into job input, runs `SignalEngine` to compute `score`, `label`, and `reasons`, persists a `Signal`, and publishes `signals:live` (Redis) for high scores.
5. ProphecyScheduler periodically queries top Signals (last 24h), fetches market/social snapshots, evaluates `CriteriaEngine`, runs `NarrativeAnalyzer`, obtains thesis from `AIProvider`, creates `Prophecy` rows (idempotency via signalHash check), and publishes `prophecies:today` to Redis.
6. API subscribes to Redis and relays `signals:live` and `prophecies:today` to WebSocket clients (or runs a mock fallback if Redis is not configured).

---

## Where prophecies are generated

- File: `apps/worker/src/prophecy/prophecy.scheduler.ts`
- Behavior:
  - Dev: runs every 2 minutes (setInterval) and evaluates up to top 50 signals from the last 24 hours, creating up to 3 prophecies per run.
  - Intended production behavior: daily UTC cron (e.g. 12:00 UTC) selecting top N and optionally posting on-chain.
  - Deduplication: the scheduler computes a `signalHash` and skips creation if a Prophecy with that hash exists.

---

## Key algorithms & heuristics

- SignalEngine (apps/worker/src/scoring/signal-engine.ts)
  - Combines z-score-like normalizations for mentions/volume with fixed weights.
  - Produces a numeric `score` clamped to [-5, 5] and labels: `HYPE_BUILDING`, `WHALE_PLAY`, `FAKE_PUMP`, `DEAD_ZONE`.
  - Tunable weights and baselines — sensible place to add unit tests and calibration tools.

- CriteriaEngine (packages/scoring)
  - Set of rule-based CriteriaSet objects. Each has an `evaluate(market, social)` predicate.
  - Returns `passed`, `matched[]`, and a simple `score` (#criteria matched).

- NarrativeAnalyzer (packages/narrative)
  - Extracts simple signals (sentiment, momentum, coherence, themes) from social snapshots.
  - Placeholder implementation — intended to be replaced/extended with better NLP or social-text analysis.

- AI Provider (packages/ai)
  - `RuleBasedProvider` produces a short thesis from matched criteria and narrative signals.
  - `OpenAIProvider` is a stub and must be extended to perform actual API calls if desired.

---

## Important implementation details & caveats

- SocialProcessor is a stub: it generates deterministic social metrics from tokenId. Replace with a real connector to get realistic narratives.
- Prophecy deduplication uses `signalHash` only; there is no DB unique constraint on `signalHash` (race conditions possible). Consider adding a unique index and handling insert conflict.
- Many fields are stored as JSON/any in Prophecy (criteria, criteriaMatched, socialSignals). Keep Prisma types consistent when evolving schema.
- Scheduler concurrency: the setInterval scheduler has no distributed lock — if you run multiple worker instances you can get duplicate prophecies. Use a lock (Redlock) or make scheduler run on a single instance.
- Publishing: publishing to Redis is conditional on `REDIS_URL` — without Redis the API falls back to a mock WS ticker.
- Timezones: `getTodayProphecies()` in the API uses UTC day boundaries; local-time seeds may appear on a neighboring day relative to local timezone.

---

## Edge cases & potential bugs

- Missing market/social snapshots → scheduler skips the signal. Ensure ingestors run before the scheduler (or seed snapshots in dev).
- Duplicate prophecies if concurrent schedulers run — add a DB unique constraint on `signalHash` and handle clashes.
- Silent catches (empty `catch {}`) hide errors (e.g., publishing failures). Replace with logging and retries.
- Rule-based defaults (AI provider, social analysis) will produce consistent but low-fidelity results until replaced with real connectors/models.

---

## How to simulate and debug locally

1. Ensure dependencies: Node 18+, Redis (recommended for full flow), and run `npm install` at repo root.
2. Setup DB and seed (apps/api):

```bash
cd apps/api
npm run db:sync   # (added helper: migrate deploy + generate + seed)
```

3. Start services:

```bash
# in one terminal
cd apps/worker && npm run start:dev

# in another terminal
cd apps/api && npm run start:dev
```

4. Verify pipeline:
- Worker logs should show `Running prophecy scheduler...` (every 2 minutes in dev) and `Published X new prophecies.` when prophecies are created.
- Check database counts:
  - `sqlite3 apps/api/prisma/dev.db "SELECT count(*) FROM Signal;"`
  - `sqlite3 apps/api/prisma/dev.db "SELECT count(*) FROM Prophecy;"`
- Hit the API endpoints:
  - `GET http://localhost:3001/signals/top` and `GET http://localhost:3001/prophecies/today`

5. Quick developer shortcuts:
- I can add a small CLI script to run `ProphecyScheduler.runOnce()` on demand (useful for testing without waiting 2 minutes). Tell me if you want it.

---

## Suggested small improvements (priority)

1. Add a unique DB index on `Prophecy.signalHash` and change create to upsert or handle unique constraint errors. (prevents race duplicates)
2. Convert `Signal.label` to a Prisma enum for type-safety.
3. Replace scheduler setInterval with `@nestjs/schedule` `@Cron` and add leader/lock to ensure single-run in multi-instance setups.
4. Replace stubbed `SocialProcessor` with a real social connector (or introduce a mock provider interface for dev vs prod).
5. Improve logging (structured logs) and avoid empty `catch {}` blocks.
6. Add unit tests for `SignalEngine`, `CriteriaEngine`, and `ProphecyScheduler` runOnce logic.

---

## Files to review next (quick links)
- `apps/worker/src/prophecy/prophecy.scheduler.ts`
- `apps/worker/src/queues/signal.processor.ts`
- `apps/worker/src/ingest/market.processor.ts`
- `apps/worker/src/scoring/signal-engine.ts`
- `packages/scoring/criteria-engine.ts`
- `packages/narrative/narrative-analyzer.ts`
- `packages/ai/ai-provider.ts`

---

## Next actionable tasks I can do for you
- Add a CLI `scripts/run-prophecy-once.ts` to trigger `ProphecyScheduler.runOnce()` and exit (fast feedback loop).
- Add DB migration to make `signalHash` unique and update create logic to be idempotent.
- Replace scheduler with cron + distributed lock (small refactor).
- Implement a real OpenAI provider call (requires API key and safe usage policy).

Tell me which of the next tasks you'd like me to implement and I will proceed.
