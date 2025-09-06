export type ScoreLabel = 'HYPE_BUILDING' | 'FAKE_PUMP' | 'DEAD_ZONE' | 'WHALE_PLAY' | 'SOCIAL_SPIKE';

export interface ScoreInput {
  mentions1h: number;
  mentions24h: number;
  slope: number;
  volume1h: number;
  volume24h: number;
  liquidity: number; // USD
  ageMin: number;
  riskFlags: string[];
}

export interface ScoreOutput {
  score: number;
  label: ScoreLabel;
  reasons: string[];
}

export class SignalEngine {
  constructor(
    private readonly weights = { m1h: 1.2, mSlope: 1.0, v1h: 1.3, liq: 0.6, age: -0.2, risk: -1.5 },
  ) {}

  score(input: ScoreInput): ScoreOutput {
    const reasons: string[] = [];

    const z = (x: number, mean: number, stdev: number) => (stdev <= 0 ? 0 : (x - mean) / stdev);

    // Heuristic baselines (demo):
    const m1hZ = z(input.mentions1h, 50, 25);
    const mSlopeZ = z(input.slope, 0, 1);
    const v1hZ = z(input.volume1h, 10000, 8000);
    const liqBucket = Math.min(3, Math.max(0, Math.log10(Math.max(1, input.liquidity)) - 2)); // 0..3 roughly
    const agePenalty = Math.min(3, input.ageMin / 60); // <=3
    const riskPenalty = Math.min(3, input.riskFlags.length);

    let score = 0;
    score += this.weights.m1h * m1hZ;
    score += this.weights.mSlope * mSlopeZ;
    score += this.weights.v1h * v1hZ;
    score += this.weights.liq * liqBucket;
    score += this.weights.age * agePenalty;
    score += this.weights.risk * riskPenalty;

    if (m1hZ > 1) reasons.push('mentions rising');
    if (mSlopeZ > 0.5) reasons.push('momentum up');
    if (v1hZ > 1) reasons.push('volume spike');
    if (liqBucket < 1) reasons.push('low liquidity');
    if (riskPenalty > 0) reasons.push('risk flags');

    // Clamp
    score = Math.max(-5, Math.min(5, score));

    let label: ScoreLabel = 'DEAD_ZONE';
    if (score >= 2.5) label = 'HYPE_BUILDING';
    else if (score >= 1.2) label = 'WHALE_PLAY';
    else if (score <= -1) label = 'FAKE_PUMP';
    else label = 'DEAD_ZONE';

    return { score: Math.round(score * 100) / 100, label, reasons };
  }
}


