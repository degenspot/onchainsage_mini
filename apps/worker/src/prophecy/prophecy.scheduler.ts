import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_PUB } from '../redis/redis.module';

@Injectable()
export class ProphecyScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_PUB) private readonly pub: any,
  ) {}

  onModuleInit() {
    // For dev: run every 2 minutes instead of daily UTC 12:00
    this.timer = setInterval(() => this.runOnce().catch(() => {}), 120_000);
  }

  private async runOnce() {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const top = await this.prisma.signal.findMany({
      where: { at: { gte: start, lte: end } },
      orderBy: [{ score: 'desc' }],
      take: 3,
    });
    let rank = 1;
    const created = [] as any[];
    for (const s of top) {
      const payload = { tokenId: s.tokenId, score: s.score, rank };
      const signalHash = this.hash(JSON.stringify(payload));
      // Idempotent: skip if a prophecy with same hash exists today
      const existing = await this.prisma.prophecy.findFirst({ where: { signalHash } });
      if (existing) continue;
      const row = await this.prisma.prophecy.create({ data: { tokenId: s.tokenId, signalHash, score: s.score, rank } });
      created.push(row);
      rank += 1;
    }
    if (this.pub && created.length) {
      try { await this.pub.publish('prophecies:today', JSON.stringify(created)); } catch {}
    }
  }

  private hash(input: string) {
    // simple non-cryptographic hash for MVP
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
    return `hash_${(h >>> 0).toString(16)}`;
  }
}


