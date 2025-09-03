import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TopSignalsParams { window: '1h'|'24h'|'7d'; limit: number }

@Injectable()
export class ReadModelService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopSignals(params: TopSignalsParams) {
    const { limit } = params;
    // Simple: order by latest `at` then by `score` desc; limit N
    const signals = await this.prisma.signal.findMany({
      orderBy: [{ at: 'desc' }, { score: 'desc' }],
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
    }));
  }
}


