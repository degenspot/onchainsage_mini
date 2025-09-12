import { RateLimiterSingleton } from './rate-limiter';
import { calculateTrendingScore } from './trending-algorithm';

export type DexScreenerPair = {
  chainId: string;
  address: string;
  priceUsd?: string;
  volume?: { h24?: number; h1?: number };
  liquidity?: { usd?: number };
  pairCreatedAt?: number; // ms epoch
  txCount?: number;
  holders?: number;
};

export type MarketSnap = {
  chainId: string;
  address: string;
  price: number;
  volume1h: number;
  volume24h: number;
  liquidity_usd: number;
  age_minutes: number;
  txCount?: number;
  holders?: number;
};

export type TrendingTimeframe = '1h' | '24h';
export type JobKind = 'search' | 'trending';
export type TrendingStrategy = 'profiles' | 'search' | 'hybrid';

const BASE_URL = process.env.DEXSCREENER_BASE || 'https://api.dexscreener.com/latest/dex';
const RATE_LIMIT = Number(process.env.DEXSCREENER_RATE_LIMIT || '300');
const RETRY_ATTEMPTS = Number(process.env.DEXSCREENER_RETRY_ATTEMPTS || '2');
const REQUEST_TIMEOUT_MS = Number(process.env.DEXSCREENER_TIMEOUT_MS || '10000');

const limiter = RateLimiterSingleton(RATE_LIMIT);

async function timeoutPromise<T>(p: Promise<T>, ms: number): Promise<T> {
  let id: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    id = setTimeout(() => rej(new Error('Request timed out')), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(id!);
  }
}

async function safeFetch(url: string, options?: RequestInit, attempts = 0): Promise<any> {
  const start = Date.now();
  try {
    const res = await limiter.schedule(() => timeoutPromise(fetch(url, { ...options, headers: { accept: 'application/json', ...(options?.headers || {}) } }), REQUEST_TIMEOUT_MS));
    const duration = Date.now() - start;
    if (!res.ok) {
      // handle 429 Rate Limit specially
      if (res.status === 429) {
        let delay = 200 * 2 ** attempts;
        const ra = res.headers.get && (res.headers.get('retry-after') as any);
        if (ra) {
          const asNum = Number(ra);
          if (!isNaN(asNum)) {
            delay = Math.max(delay, asNum * 1000);
          } else {
            const parsed = Date.parse(String(ra));
            if (!isNaN(parsed)) {
              delay = Math.max(delay, parsed - Date.now());
            }
          }
        }
        console.warn(`[dexscreener] 429 from ${url}, retrying in ${delay}ms (attempt ${attempts + 1})`);
        if (attempts < RETRY_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, Math.max(0, delay)));
          return safeFetch(url, options, attempts + 1);
        }
        const text429 = await res.text().catch(() => '<no body>');
        throw new Error(`DexScreener HTTP 429 - ${text429}`);
      }
      const text = await res.text().catch(() => '<no body>');
      const err = new Error(`DexScreener HTTP ${res.status} ${res.statusText} - ${text}`);
      // retry on 5xx
      if (res.status >= 500 && attempts < RETRY_ATTEMPTS) {
        const backoff = 200 * 2 ** attempts;
        await new Promise((r) => setTimeout(r, backoff));
        return safeFetch(url, options, attempts + 1);
      }
      throw err;
    }
    const json = await res.json().catch((e) => {
      throw new Error(`Invalid JSON from ${url}: ${String(e)}`);
    });
    // simple log for debugging
    if (process.env.DEBUG_DEX) console.debug(`[dexscreener] GET ${url} ${res.status} ${duration}ms`);
    return json;
  } catch (err) {
    if (attempts < RETRY_ATTEMPTS && /5\d{2}|timed out|timed out/i.test(String(err))) {
      const backoff = 200 * 2 ** attempts;
      await new Promise((r) => setTimeout(r, backoff));
      return safeFetch(url, options, attempts + 1);
    }
    throw err;
  }
}

export async function fetchPairsByQuery(query: string): Promise<MarketSnap[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const data = await safeFetch(url);
  const now = Date.now();
  const pairs = (data.pairs || []) as DexScreenerPair[];
  return pairs
    .slice(0, 10)
    .map((p) => {
      // defensive normalization
      const chainId = p.chainId || (p as any).chain || 'unknown';
      const address = p.address || (p as any).pairAddress || undefined;
      return {
        chainId: String(chainId),
        address: address ? String(address) : undefined,
        price: Number(p.priceUsd || 0),
        volume1h: Number(p.volume?.h1 || 0),
        volume24h: Number(p.volume?.h24 || 0),
        liquidity_usd: Number(p.liquidity?.usd || 0),
        age_minutes: p.pairCreatedAt ? Math.max(0, Math.round((now - p.pairCreatedAt) / 60000)) : 0,
        txCount: p.txCount,
        holders: p.holders,
      } as MarketSnap;
    })
    .filter((s) => s.address && s.chainId);
}

/**
 * Custom trending discovery combining token profiles and search heuristics
 */
export async function fetchTrendingPairs(timeframe: TrendingTimeframe = '24h', strategy: TrendingStrategy = 'hybrid'): Promise<MarketSnap[]> {
  // strategy 1: token profiles endpoint
  const profilesUrl = `${BASE_URL}/token-profiles/latest/v1`;
  const candidates: MarketSnap[] = [];
  try {
    if (strategy === 'profiles' || strategy === 'hybrid') {
      const data = await safeFetch(profilesUrl).catch(() => null);
      const now = Date.now();
      if (data && Array.isArray(data.profiles)) {
        for (const p of data.profiles.slice(0, 200)) {
          candidates.push({
            chainId: p.chainId || p.chain || 'unknown',
            address: p.address || p.pairAddress,
            price: Number(p.priceUsd || 0),
            volume1h: Number(p.volume?.h1 || p.volume_1h || 0),
            volume24h: Number(p.volume?.h24 || p.volume_24h || 0),
            liquidity_usd: Number(p.liquidity?.usd || p.liquidity_usd || 0),
            age_minutes: p.pairCreatedAt ? Math.max(0, Math.round((now - p.pairCreatedAt) / 60000)) : 0,
            txCount: p.txCount,
            holders: p.holders,
          });
        }
      }
    }

    // strategy 2: search popular chains
    if (strategy === 'search' || strategy === 'hybrid') {
      const terms = ['base', 'ethereum', 'solana', 'arbitrum', 'optimism', 'matic'];
      for (const t of terms) {
        try {
          const res = await safeFetch(`${BASE_URL}/search?q=${encodeURIComponent(t)}`);
          const now = Date.now();
          const pairs = (res.pairs || []).slice(0, 50) as DexScreenerPair[];
            for (const p of pairs) {
              const chainId = p.chainId || (p as any).chain || 'unknown';
              const address = p.address || (p as any).pairAddress || undefined;
              if (!address) continue; // skip incomplete
              candidates.push({
                chainId: String(chainId),
                address: String(address),
                price: Number(p.priceUsd || 0),
                volume1h: Number(p.volume?.h1 || 0),
                volume24h: Number(p.volume?.h24 || 0),
                liquidity_usd: Number(p.liquidity?.usd || 0),
                age_minutes: p.pairCreatedAt ? Math.max(0, Math.round((now - p.pairCreatedAt) / 60000)) : 0,
                txCount: p.txCount,
                holders: p.holders,
              });
            }
        } catch (e) {
          // continue on per-term failure
          if (process.env.DEBUG_DEX) console.debug(`search term ${t} failed: ${String(e)}`);
        }
      }
    }
  } catch (e) {
    // log outer failures but continue with whatever candidates we have
    console.error('[dexscreener] fetchTrendingPairs outer error', String(e));
  }

  // dedupe by chain:address and compute scores
  const map = new Map<string, MarketSnap>();
  for (const c of candidates) {
    if (!c.address) continue;
    const key = `${c.chainId}:${c.address}`;
    const existing = map.get(key);
    if (!existing) map.set(key, c);
    else {
      // merge volumes and liquidity heuristically
      existing.volume1h = Math.max(existing.volume1h || 0, c.volume1h || 0);
      existing.volume24h = Math.max(existing.volume24h || 0, c.volume24h || 0);
      existing.liquidity_usd = Math.max(existing.liquidity_usd || 0, c.liquidity_usd || 0);
      existing.price = existing.price || c.price;
    }
  }

  const scored = Array.from(map.values()).map((p) => ({
    snap: p,
    score: calculateTrendingScore(p, timeframe),
  }));

  // filter obvious scams and apply thresholds
  const filtered = scored.filter(({ snap }) => {
    if (!snap.liquidity_usd || snap.liquidity_usd < 1000) return false;
    if (snap.age_minutes && snap.age_minutes < 10 && snap.volume24h && snap.volume24h > 1e6) return false;
    return true;
  });

  // diversity: max 3 per chain
  const byChainCount = new Map<string, number>();
  const result: MarketSnap[] = [];
  filtered.sort((a, b) => b.score - a.score);
  for (const { snap } of filtered.slice(0, 500)) {
    const c = (byChainCount.get(snap.chainId) || 0);
    if (c >= 3) continue;
    byChainCount.set(snap.chainId, c + 1);
    result.push(snap);
    if (result.length >= 50) break;
  }

  return result;
}
 

