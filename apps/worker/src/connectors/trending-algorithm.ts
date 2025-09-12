import { MarketSnap } from './dexscreener';

export function volumeGrowthRate(snap: MarketSnap) {
  const v24 = snap.volume24h || 0;
  const v1 = snap.volume1h || 0;
  if (v24 <= 0) return v1 > 0 ? 1 : 0;
  return v1 / (v24 / 24);
}

export function ageBonus(ageMin?: number) {
  if (!ageMin) return 0;
  if (ageMin < 60) return 1.5;
  if (ageMin < 60 * 24) return 1.2;
  return 1;
}

export function calculateTrendingScore(snap: MarketSnap, timeframe: '1h' | '24h' = '24h') {
  const volGrowth = volumeGrowthRate(snap);
  const liquidity = snap.liquidity_usd || 0;
  const age = snap.age_minutes || 0;
  const tx = snap.txCount || 0;
  const holders = snap.holders || 0;

  // weights - configurable via env later if needed
  const wVol = 0.5;
  const wLiq = 0.2;
  const wAge = 0.15;
  const wActivity = 0.15;

  const volScore = Math.log10(1 + (timeframe === '1h' ? snap.volume1h : snap.volume24h) + 1) * volGrowth;
  const liqScore = Math.log10(1 + liquidity);
  const ageScore = ageBonus(age);
  const activity = Math.log10(1 + tx + holders);

  const score = wVol * volScore + wLiq * liqScore + wAge * ageScore + wActivity * activity;
  return Number.isFinite(score) ? score : 0;
}

export default calculateTrendingScore;
