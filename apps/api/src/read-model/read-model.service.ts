import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TopSignalsParams { window: '1h'|'24h'|'7d'; limit: number }
export interface DashboardOverview {
  totalProphecies: number;
  highConfidence: number;
  emergingTrends: number;
  riskyProphecies: number;
  lastUpdate: string;
}

export interface WeeklyProphecyCount {
  date: string;
  total: number;
  highConfidence: number;
  emergingTrends: number;
  risky: number;
}

export interface SignalHistoryPoint {
  date: string;
  avgScore: number;
  totalSignals: number;
  labelCounts: Record<string, number>;
}

@Injectable()
export class ReadModelService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopSignals(params: TopSignalsParams) {
    const { limit, window } = params;
    const end = new Date();
    const start = new Date(
      end.getTime() - (window === '1h' ? 60 * 60_000 : window === '24h' ? 24 * 60 * 60_000 : 7 * 24 * 60 * 60_000),
    );
    const signals = await this.prisma.signal.findMany({
      where: { at: { gte: start, lte: end } },
      orderBy: [{ score: 'desc' }, { at: 'desc' }],
      take: Math.min(limit, 50),
      include: { token: true },
    });
    return signals.map((s) => ({
      tokenId: s.tokenId,
      chain: s.token.chain,
      address: s.token.address,
      symbol: s.token.symbol ?? undefined,
      score: s.score,
      label: s.label as any,
      at: s.at.toISOString(),
    }));
  }

  async getTokenSignals(chain: string, address: string, limit = 20) {
    const tokenId = `${chain}:${address}`;
    const signals = await this.prisma.signal.findMany({
      where: { tokenId },
      orderBy: { at: 'desc' },
      take: Math.min(limit, 100),
    });
    return signals.map((s) => ({
      tokenId: s.tokenId,
      score: s.score,
      label: s.label as any,
      at: s.at.toISOString(),
    }));
  }

  async getTodayProphecies() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const rows = await this.prisma.prophecy.findMany({
      where: { postedAt: { gte: start, lte: end } },
      orderBy: [{ postedAt: 'desc' }, { rank: 'asc' }],
      include: { token: true },
    });
    return rows.map((p) => ({
      tokenId: p.tokenId,
      chain: p.token.chain,
      address: p.token.address,
      symbol: p.token.symbol ?? undefined,
      score: p.score,
      rank: p.rank,
      signalHash: p.signalHash,
      txHash: p.txHash ?? undefined,
      postedAt: p.postedAt.toISOString(),
      criteria: p.criteria as any,
      thesis: p.thesis ?? undefined,
      narrativeScore: p.narrativeScore,
      criteriaMatched: p.criteriaMatched as any,
      socialSignals: p.socialSignals as any,
    }));
  }

  // Dashboard helpers
  async getDashboardOverview(): Promise<DashboardOverview> {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total = await this.prisma.prophecy.count({ where: { postedAt: { gte: start, lte: end } } });
    const high = await this.prisma.prophecy.count({ where: { postedAt: { gte: start, lte: end }, score: { gte: 0.8 } } });
    const emerging = await this.prisma.prophecy.count({ where: { postedAt: { gte: start, lte: end }, score: { gte: 0.5, lt: 0.8 } } });
    const risky = await this.prisma.prophecy.count({ where: { postedAt: { gte: start, lte: end }, score: { lt: 0.5 } } });

    return {
      totalProphecies: total,
      highConfidence: high,
      emergingTrends: emerging,
      riskyProphecies: risky,
      lastUpdate: new Date().toISOString(),
    };
  }

  async getWeeklyProphecyCounts(from?: Date, to?: Date): Promise<WeeklyProphecyCount[]> {
    const end = to ?? new Date();
    const start = from ?? new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Use raw query for day grouping (SQLite/compatible)
    const rows: Array<{ date: string; total: number; high: number; emerging: number; risky: number }> = await this.prisma.$queryRaw`
      SELECT
        date(postedAt) as date,
        count(*) as total,
        sum(CASE WHEN score >= 0.8 THEN 1 ELSE 0 END) as high,
        sum(CASE WHEN score >= 0.5 AND score < 0.8 THEN 1 ELSE 0 END) as emerging,
        sum(CASE WHEN score < 0.5 THEN 1 ELSE 0 END) as risky
      FROM Prophecy
      WHERE postedAt BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      GROUP BY date(postedAt)
      ORDER BY date(postedAt) ASC
    ` as any;

    return rows.map((r) => ({
      date: r.date,
      total: Number(r.total || 0),
      highConfidence: Number(r.high || 0),
      emergingTrends: Number(r.emerging || 0),
      risky: Number(r.risky || 0),
    }));
  }

  async getSignalHistory(params: { window: '7d' | '30d' | '90d'; limit?: number }): Promise<SignalHistoryPoint[]> {
    const { window } = params;
    const days = window === '7d' ? 7 : window === '30d' ? 30 : 90;
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    // Aggregate by date
    const rows: Array<{ date: string; avgScore: number; total: number }> = await this.prisma.$queryRaw`
      SELECT date(at) as date, avg(score) as avgScore, count(*) as total
      FROM Signal
      WHERE at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      GROUP BY date(at)
      ORDER BY date(at) ASC
    ` as any;

    // For label counts per day, do a simple per-day query (acceptable for small windows)
    const result: SignalHistoryPoint[] = [];
    for (const r of rows) {
      const labelCountsRaw: Array<{ label: string; cnt: number }> = await this.prisma.$queryRaw`
        SELECT label, count(*) as cnt FROM Signal WHERE date(at) = ${r.date} GROUP BY label
      ` as any;
      const labelCounts: Record<string, number> = {};
      for (const lc of labelCountsRaw) labelCounts[lc.label] = Number(lc.cnt || 0);
      result.push({
        date: r.date,
        avgScore: Number(r.avgScore || 0),
        totalSignals: Number(r.total || 0),
        labelCounts,
      });
    }

    return result;
  }
}


