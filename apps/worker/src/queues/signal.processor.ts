import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_PUB } from '../redis/redis.module';
import { SIGNAL_QUEUE } from './bull.module';
import { SignalEngine, ScoreInput } from '../scoring/signal-engine';

@Injectable()
export class SignalProcessor implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_PUB) private readonly pub: any,
  ) {}

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    } as any);
    new Worker(
      SIGNAL_QUEUE,
      async (job) => {
        const { tokenId, input } = job.data as { tokenId: string; input: ScoreInput };
        // Merge latest social snapshot if present
        const latestSocial = await this.prisma.socialSnapshot.findFirst({
          where: { tokenId },
          orderBy: { at: 'desc' },
        });
        const merged: ScoreInput = {
          mentions1h: latestSocial?.mentions1h ?? input.mentions1h ?? 0,
          mentions24h: latestSocial?.mentions24h ?? input.mentions24h ?? 0,
          slope: latestSocial?.slope ?? input.slope ?? 0,
          volume1h: input.volume1h,
          volume24h: input.volume24h,
          liquidity: input.liquidity,
          ageMin: input.ageMin,
          riskFlags: input.riskFlags || [],
        };
        const engine = new SignalEngine();
        const out = engine.score(merged);
        const at = new Date().toISOString();
        const [chain, address] = tokenId.split(':');
        await this.prisma.token.upsert({ where: { id: tokenId }, update: {}, create: { id: tokenId, chain, address } });
        const row = await this.prisma.signal.create({
          data: { tokenId, score: out.score, label: out.label, reasons: out.reasons, at: new Date(at) },
        });
        if (this.pub && out.score >= 1.0) {
          try { await this.pub.publish('signals:live', JSON.stringify({ tokenId, score: out.score, label: out.label, at: row.at.toISOString() })); } catch {}
        }
      },
      { connection },
    );
  }
}


