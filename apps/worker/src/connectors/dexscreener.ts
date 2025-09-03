export type DexScreenerPair = {
  chainId: string;
  address: string;
  priceUsd?: string;
  volume?: { h24?: number; h1?: number };
  liquidity?: { usd?: number };
  pairCreatedAt?: number; // ms epoch
};

export type MarketSnap = {
  chainId: string;
  address: string;
  price: number;
  volume1h: number;
  volume24h: number;
  liquidity_usd: number;
  age_minutes: number;
};

const BASE_URL = process.env.DEXSCREENER_BASE || 'https://api.dexscreener.com/latest/dex';

export async function fetchPairsByQuery(query: string): Promise<MarketSnap[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'accept': 'application/json' } as any });
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
  const data = (await res.json()) as { pairs?: DexScreenerPair[] };
  const now = Date.now();
  return (data.pairs || []).slice(0, 10).map((p) => ({
    chainId: p.chainId,
    address: p.address,
    price: Number(p.priceUsd || 0),
    volume1h: Number(p.volume?.h1 || 0),
    volume24h: Number(p.volume?.h24 || 0),
    liquidity_usd: Number(p.liquidity?.usd || 0),
    age_minutes: p.pairCreatedAt ? Math.max(0, Math.round((now - p.pairCreatedAt) / 60000)) : 0,
  }));
}


