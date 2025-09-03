# 🧩 OnChain Sage — MVP Architecture (Opinionated, Free-tier)

## Monorepo (npm workspaces)
```
onchain-sage/
  apps/
    api/            # NestJS (REST + WebSocket)
    worker/         # NestJS worker (BullMQ jobs)
    bot/            # Telegram/X poster (NestJS + Telegraf)
    frontend/       # Next.js frontend (Vercel)
  packages/
    connectors/     # social + market + chain adapters
    scoring/        # signal engine (rules + optional AI)
    shared/         # dto, types, utils
  contracts/
    prophecy-registry/  # Solidity (Foundry) on Base
  infra/
    docker/ k8s/ (optional later)
```

---

## Data Flow (end-to-end)

1) **Ingest**  
- `worker` runs every 5–10 min (Nest Schedule + BullMQ):  
  - `SocialIngestJob`: fetch trending tickers (LunarCrush free API or your scraper).  
  - `MarketIngestJob`: fetch on-chain market stats from **DexScreener**.  
  - Store raw snapshots.

2) **Score**  
- `SignalEngine` (package `scoring/`) merges latest {mentions, velocity, volume, liquidity, age}.  
- Heuristic v1 (no paid AI):  
  ```
  score = w1*zscore(mentions_1h) 
        + w2*zscore(mentions_slope) 
        + w3*zscore(volume_1h) 
        + w4*liquidity_bucket
        - w5*risk_flags (honeypot, low LP, renounced? etc.)
  ```
- Classify: `HYPE_BUILDING`, `FAKE_PUMP`, `DEAD_ZONE`, `WHale_PLAY`.

3) **Serve**  
- `api` exposes REST:  
  - `GET /signals/top?window=24h&limit=10`  
  - `GET /signals/:tokenAddress`  
- WebSocket channel `signals:live` broadcasts updates to `frontend`.

4) **Publish**  
- Daily at UTC 12:00: `ProphecyJob` picks top N (e.g., 3) and:  
  - writes **prophecy rows** to DB,  
  - **posts to chain** (`contracts/prophecy-registry` on **Base** to keep gas dirt-cheap),  
  - **posts to Telegram** and (optionally) X.

> Note: Even if many targets are **Solana** (Raydium), we **anchor prophecies on Base** (EVM) for simplicity + low gas in MVP. Targets remain chain-agnostic in DB (we store the chain + address). You can add Solana anchoring later.

---

## Concretely Picked Stack (free-tier friendly)

- **Backend**: NestJS 10 (TypeScript)  
- **Queue**: BullMQ (Redis). Use **Upstash Redis free tier**.  
- **DB**: Postgres (Supabase free tier) + **Prisma** ORM.  
- **Cache**: Redis (same Upstash).  
- **RPC**: Base via Alchemy/Infura free plan (for the minimal contract calls).  
- **Contracts**: Solidity + **Foundry**; deploy to **Base**.  
- **Frontend**: Next.js (App Router) + Tailwind; deploy on **Vercel** free.  
- **Hosting**: `api` + `worker` + `bot` on **Fly.io** (free allowance) or **Render** free.  
- **Secrets**: Supabase + Vercel envs.  
- **AI**: **disabled by default**; the engine is designed to swap in an AI provider later.

---

## NestJS Modules (by app)

### `apps/api` (NestJS)
- `SignalsModule`  
  - `SignalsController` (REST)  
  - `SignalsGateway` (WebSocket)  
  - `SignalsService` (query latest scores, paginate)  
- `ReadModelModule`  
  - repositories via Prisma (read-optimized queries)  
- `HealthModule` (ready/liveness)  
- `AuthModule` (simple API key for admin routes)

### `apps/worker` (NestJS)
- `IngestModule`  
  - `SocialIngestProcessor` (BullMQ queue `social`)  
  - `MarketIngestProcessor` (queue `market`)  
  - fetchers from `packages/connectors`  
- `ScoringModule`  
  - `SignalEngineService` (from `packages/scoring`)  
  - `RankerService` (top N per window)  
- `ProphecyModule`  
  - `ProphecyScheduler` (cron daily)  
  - `ChainPublisherService` (calls `contracts` adapter)  
  - `BotsPublisherService` (Telegram/X)

### `apps/bot` (NestJS)
- `TelegramModule` (Telegraf)  
  - Commands: `/top`, `/token <addr>`, `/watch <addr>`  
  - Subscribes to Redis pubsub for fresh signals.

---

## Connectors (package `packages/connectors`)

- `social/`  
  - `TwitterTrendsProvider` (your scraper or LunarCrush free)  
  - Output: `{symbol, mentions_1h, mentions_24h, slope}`

- `market/`  
  - `DexScreenerProvider`  
  - Output: `{chainId, address, price, volume_1h, volume_24h, liquidity_usd, age_minutes}`

- `risk/` (lightweight heuristics)  
  - `HoneypotCheck` (uses known community endpoints if available)  
  - `LiquidityLockCheck` (best-effort)

- `chain/`  
  - `EvmAdapter` (ethers/viem) → **Base**; functions:  
    - `postProphecy(signalHash, tokenRef, uri)`  
    - `verifyTx(txHash)`  
  - (Later) `SolanaAdapter`, `StarknetAdapter` behind same interface.

_All connectors implement stable TypeScript interfaces so they can be swapped for hackathons (e.g., replace DexScreener with Birdeye quickly)._

---

## Contracts (MVP-minimal, on Base)

`ProphecyRegistry.sol` (Foundry)
- `event ProphecyPosted(bytes32 signalHash, string tokenRef, string chainRef, string uri, uint256 timestamp);`
- `function post(bytes32 signalHash, string calldata tokenRef, string calldata chainRef, string calldata uri) external;`

**Design choices:**
- **No heavy storage** (emit events; indexable, cheap).  
- `signalHash = keccak256(JSON.stringify(signalCanonicalPayload))` where payload includes `{tokenAddress, chain, timestamp, score, rank}`.  
- `uri` can be a short link (later IPFS/Arweave). For MVP, keep it empty or a compact JSON string if needed.  
- Access control: none for MVP (ship fast). If you want basic control: add `onlyOwner` and post via backend wallet.

---

## Database Schema (Prisma)

```
model Token {
  id            String  @id // `${chain}:${address}`
  chain         String
  address       String
  symbol        String?
  createdAt     DateTime @default(now())
  // relations
  marketSnaps   MarketSnapshot[]
  socialSnaps   SocialSnapshot[]
  signals       Signal[]
}

model MarketSnapshot {
  id        String   @id @default(cuid())
  tokenId   String
  volume1h  Float
  volume24h Float
  liquidity Float
  price     Float
  ageMin    Int
  at        DateTime @default(now())
  token     Token    @relation(fields: [tokenId], references: [id])
  @@index([tokenId, at])
}

model SocialSnapshot {
  id         String   @id @default(cuid())
  tokenId    String
  mentions1h Int
  mentions24h Int
  slope      Float
  at         DateTime @default(now())
  token      Token    @relation(fields: [tokenId], references: [id])
  @@index([tokenId, at])
}

model Signal {
  id        String   @id @default(cuid())
  tokenId   String
  score     Float
  label     String   // HYPE_BUILDING | FAKE_PUMP | DEAD_ZONE | WHALE_PLAY
  reasons   Json
  at        DateTime @default(now())
  token     Token    @relation(fields: [tokenId], references: [id])
  @@index([at, score])
}

model Prophecy {
  id          String   @id @default(cuid())
  tokenId     String
  signalHash  String
  score       Float
  rank        Int
  txHash      String?
  postedAt    DateTime @default(now())
  token       Token    @relation(fields: [tokenId], references: [id])
}
```

---

## Public API (REST) — `apps/api`

- `GET /signals/top?window=24h&limit=5` → top ranked signals with token meta.  
- `GET /signals/:chain/:address` → recent scores & classification.  
- `GET /prophecies/today` → today’s anchored picks.  
- `GET /health` → ok.

**WebSocket**  
- Channel: `signals:live` → emits `{tokenId, score, label, at}` when a fresh signal beats threshold.

---

## Scoring Engine (package `scoring/`)

```ts
export interface ScoreInput {
  mentions1h: number; mentions24h: number; slope: number;
  volume1h: number; volume24h: number; liquidity: number;
  ageMin: number; riskFlags: string[];
}

export interface ScoreOutput {
  score: number; label: 'HYPE_BUILDING'|'FAKE_PUMP'|'DEAD_ZONE'|'WHALE_PLAY';
  reasons: string[];
}

export class SignalEngine {
  constructor(private weights = {m1h:1.2, mSlope:1.0, v1h:1.3, liq:0.6, age:-0.2, risk:-1.5}) {}

  score(i: ScoreInput): ScoreOutput { /* implement deterministic formula; no paid AI */ }
}
```

> Later, slot an **AIProvider**:
```ts
export interface AIProvider { summarize(input): Promise<string>; }
```
…but keep disabled by default to stay free.

---

## Frontend (Next.js on Vercel)

- **Home**: “Today’s Top Signals” list (token, chain, score, label, quick reasons).  
- **Token page**: small chart (client-side from recent snapshots), links to DexScreener/Raydium.  
- **Live bar**: connects to WS `signals:live`.  
- **No auth** for MVP.

---

## Environment & Costs (free-tier)

- **Supabase** (Postgres): free.  
- **Upstash Redis**: free.  
- **Vercel** (frontend): free.  
- **Fly.io / Render** (`api`, `worker`, `bot`): free tiers.  
- **Alchemy/Infura (Base RPC)**: free plan sufficient for a few tx/day.  
- **DexScreener / LunarCrush**: free endpoints; respect rate limits.

---

## Security / Reliability (MVP sane defaults)

- Validate all external inputs, whitelist chains.  
- Map symbols → **canonical tokenId** (`chain:address`) to avoid symbol spoofing.  
- Backoff + jitter on fetchers; persist last successful cursor.  
- Simple dedupe on snapshots (unique tokenId + minute).  
- Post `Prophecy` on chain **after** DB commit; if tx fails, retry with idempotency key.

---

## 10-Day Build Plan

**Day 1–2**  
- Bootstrap monorepo, set up Prisma + Supabase schema, Upstash, BullMQ.  
- Implement `DexScreenerProvider`, `Twitter/LunarCrushProvider`.

**Day 3–4**  
- `worker`: ingest processors + persistence.  
- `scoring`: deterministic engine + ranker.

**Day 5**  
- `api`: endpoints + WS; integrate read models.

**Day 6**  
- `frontend`: pages for Top Signals + Token Detail; WS live ticker.

**Day 7**  
- `contracts`: write `ProphecyRegistry.sol`, deploy to Base testnet → mainnet.  
- `chain` adapter in `connectors`.

**Day 8**  
- `ProphecyJob`: select top 3, hash, emit event, record txHash.  
- `bot`: Telegram `/top`.

**Day 9**  
- CI (GitHub Actions): lint, test, typecheck, deploy frontend/api/worker.  
- Seed script + sample data.

**Day 10**  
- Hardening: rate limits, error pages, logs; write README + contributor guide.

---

## Minimal Contract ABI (for your adapter)
```solidity
event ProphecyPosted(bytes32 signalHash, string tokenRef, string chainRef, string uri, uint256 timestamp);

function post(bytes32 signalHash, string calldata tokenRef, string calldata chainRef, string calldata uri) external;
```

---

## .env (example)
```
DATABASE_URL=...
REDIS_URL=...
DEXSCREENER_BASE=https://api.dexscreener.com/latest/dex
LUNARCRUSH_KEY=...   # or TWITTER_SCRAPER=true
RPC_BASE=https://base-mainnet.g.alchemy.com/v2/...
POSTER_PRIVATE_KEY=0x...
TELEGRAM_BOT_TOKEN=...
