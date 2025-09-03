## OnChain Sage — Monorepo

Apps:
- API (NestJS) — REST + WebSocket
- Worker (NestJS) — queues, ingestion, scoring, publishers
- Frontend (Next.js) — optional for now

### Prerequisites
- Node 18+ (or latest LTS)
- Redis (local `redis://localhost:6379` or Upstash URL)

### Install
```bash
npm install
```

### Environment
Set env files as needed.

API (`apps/api/.env`):
```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
# Optional: set if you have Redis
# REDIS_URL=redis://localhost:6379
```

Worker (`apps/worker/.env`):
```bash
# Optional: set if you have Redis (recommended for WS live)
# REDIS_URL=redis://localhost:6379
```

Note: API uses SQLite by default (no DB setup required). The DB file is `apps/api/prisma/dev.db`.

### Initialize Database (first time)
```bash
cd apps/api
npm run db:setup
# runs prisma generate → migrate → seed (adds demo token/signals)
```

### Run Services (local)
In two terminals:

1) Worker (queues, ingestion, scoring)
```bash
cd apps/worker
npm run start:dev
```

2) API (REST + WS)
```bash
cd apps/api
npm run start:dev
```

Optional 3) Frontend (if you want UI now)
```bash
cd apps/frontend
# ensure NEXT_PUBLIC_API_URL points to API, e.g. http://localhost:3001
npm run dev
```

### Verify
- REST:
  - GET http://localhost:3001/health
  - GET http://localhost:3001/signals/top
  - GET http://localhost:3001/prophecies/today

- WebSocket (without frontend):
```bash
npm i -g wscat
wscat -c ws://localhost:3001
# expect messages: {"type":"signals:live","data":{ tokenId, score, label, at }}
```

### How data flows (local demo)
- Worker enqueues market and scoring jobs on intervals.
- Market snapshots are persisted; scoring computes `Signal` rows and publishes to `signals:live` via Redis if configured.
- API serves REST from SQLite and relays WS events (falls back to mock if Redis not set).

### Troubleshooting
- Port already in use: stop previous processes or change PORT in `.env`.
- No WS updates: ensure `REDIS_URL` is set for both API and worker or rely on API mock fallback.
- See data: run `npx prisma studio` in `apps/api` to view tables.


