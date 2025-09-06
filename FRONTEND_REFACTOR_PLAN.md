## Frontend Refactor Plan — TanStack Query + API wiring

### Objectives
- Adopt TanStack React Query for all data fetching/caching.
- Call all available API endpoints with correct shapes.
- Handle WebSocket streams for live updates.
- Maintain clean separation: api client, hooks, UI.

---

### Endpoints to integrate
- GET `/signals/top?window=24h&limit=5`
  - Response: `{ tokenId, chain, address, symbol?, score, label, at }[]`
- GET `/signals/:chain/:address`
  - Response: `{ tokenId, score, label, at }[]`
- GET `/prophecies/today`
  - Response: `{ tokenId, chain, address, symbol?, score, rank, signalHash, txHash?, postedAt }[]`
- GET `/health`
  - Response: `{ ok: boolean, db: 'ok'|'error' }`

Environment
- `NEXT_PUBLIC_API_URL` e.g., `http://localhost:3001`

---

### Architecture & Folders
- `apps/frontend/`
  - `lib/api/client.ts` — fetch wrapper (baseURL, headers, error normalize)
  - `lib/api/types.ts` — DTO types mirroring backend
  - `lib/query/keys.ts` — central query keys
  - `lib/query/hooks.ts` — React Query hooks
  - `lib/ws/socket.ts` — WS client, listeners
  - `providers/query-provider.tsx` — QueryClientProvider (retry, staleTime, etc.)
  - `components/` — UI consuming hooks

---

### Data contracts (TypeScript)
```ts
export type ApiSignalTop = {
  tokenId: string;
  chain: string;
  address: string;
  symbol?: string;
  score: number;
  label: 'HYPE_BUILDING'|'FAKE_PUMP'|'DEAD_ZONE'|'WHALE_PLAY';
  at: string;
};

export type ApiTokenSignals = {
  tokenId: string;
  score: number;
  label: ApiSignalTop['label'];
  at: string;
}[];

export type ApiProphecy = {
  tokenId: string;
  chain: string;
  address: string;
  symbol?: string;
  score: number;
  rank: number;
  signalHash: string;
  txHash?: string;
  postedAt: string;
};
```

---

### Query keys
```ts
export const qk = {
  signals: {
    top: (window: '1h'|'24h'|'7d', limit: number) => ['signals','top', window, limit] as const,
    token: (chain: string, address: string, limit?: number) => ['signals','token', chain, address, limit] as const,
  },
  prophecies: {
    today: () => ['prophecies','today'] as const,
  },
  health: () => ['health'] as const,
};
```

---

### React Query hooks
- `useTopSignals(window='24h', limit=10)`
  - GET `/signals/top`
  - staleTime: 10s; refetchInterval: 10–15s (plus WS updates)
- `useTokenSignals(chain, address, limit=50)`
  - GET `/signals/:chain/:address`
  - staleTime: 15s; refetch on window focus
- `usePropheciesToday()`
  - GET `/prophecies/today`
  - staleTime: 60s; refetchInterval: 60s (plus WS updates)
- `useHealth()`
  - GET `/health`
  - staleTime: 30s; retry: false

---

### WebSocket integration
- WS URL: `ws://<API_HOST>:<PORT>`
- Subscriptions:
  - `type: 'signals:live'` → payload `{ tokenId, score, label, at }`
  - `type: 'prophecies:today'` → payload `ApiProphecy[]` (batch)
- Strategy:
  - On `signals:live`, optimistic update `qk.signals.top` cache by preprending/re-sorting if token exists.
  - On `prophecies:today`, invalidate `qk.prophecies.today()` and optionally merge payload.
  - Gracefully degrade: if WS closed, rely on refetch intervals.

---

### UI updates
- Dashboard
  - Replace ad-hoc fetch in `components/signal-table.tsx` with `useTopSignals`.
  - Add filter controls for window (1h/24h/7d) and limit.
  - Live updates via WS + cache update.
- Token detail page
  - Use `useTokenSignals` for recent scores; small trend chart client-side.
- Simple Prophecies section
  - Use `usePropheciesToday` to list rank, token, score, posted time.

---

### Provider setup
- Add `QueryClientProvider` at root layout:
  - defaultOptions: `{ queries: { retry: 1, refetchOnWindowFocus: false } }`
  - Devtools optional for local.

---

### Error/loading UX
- Centralized `ErrorFallback` and `Skeleton` components.
- For 429/5xx, show inline retry CTA; surface rate limit hints.

---

### Testing & verification
- Mock API via MSW for component tests of hooks.
- Manual E2E:
  - Run worker+API.
  - Verify dashboard updates from WS without manual refresh.
  - Switch window filters and see query keys/result change.

---

### Incremental rollout (PR sequence)
1) Add QueryClientProvider, api client, types, keys.
2) Migrate dashboard list to `useTopSignals` + WS updates.
3) Add token detail with `useTokenSignals`.
4) Add prophecies list with `usePropheciesToday` + WS invalidation.
5) Polish: error states, loading, empty states.

---

## Status Snapshot (2025-09-04)

- Frontend (Next.js) is present and can run independently; it expects API at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
- WebSocket support in API is functional; enabling `REDIS_URL` improves live updates.

Direction: focus on polishing components and hooking live WS events to UI charts; add local dev docker compose to run API + Worker + Redis for integrated testing.


