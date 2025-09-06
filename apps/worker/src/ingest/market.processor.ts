import { Inject, Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { MARKET_QUEUE, SIGNAL_QUEUE_TOKEN, SOCIAL_QUEUE_TOKEN } from '../queues/bull.module';
import { PrismaService } from '../prisma/prisma.service';
import { fetchPairsByQuery } from '../connectors/dexscreener';
import { Queue } from 'bullmq';
import { RiskAnalyzer } from '@onchainsage/connectors/risk/risk-analyzer';

@Injectable()
export class MarketProcessor {
  private riskAnalyzer: RiskAnalyzer;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SIGNAL_QUEUE_TOKEN) private readonly signalQueue: Queue,
    @Inject(SOCIAL_QUEUE_TOKEN) private readonly socialQueue: Queue,
  ) {
    this.riskAnalyzer = new RiskAnalyzer();
  }

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    } as any);
    new Worker(
      MARKET_QUEUE,
      async (job) => {
        const { query } = job.data as { query: string };
        const snaps = await fetchPairsByQuery(query);
        for (const s of snaps) {
          const tokenId = `${s.chainId}:${s.address}`;
          await this.prisma.token.upsert({
            where: { id: tokenId },
            update: {},
            create: { id: tokenId, chain: s.chainId, address: s.address },
          });
          await this.prisma.marketSnapshot.create({
            data: {
              tokenId,
              volume1h: s.volume1h,
              volume24h: s.volume24h,
              liquidity: s.liquidity_usd,
              price: s.price,
              ageMin: s.age_minutes,
            },
          });

          // Perform risk analysis
          const riskFlags = await this.riskAnalyzer.analyze(s.address, s.chainId);

          // enqueue social job to update mentions/slope
          await this.socialQueue.add('social-stub', { tokenId });
          // enqueue a scoring job using market + latest social (social processor runs in parallel)
          await this.signalQueue.add('score-from-market', {
            tokenId,
            input: {
              mentions1h: 0,
              mentions24h: 0,
              slope: 0,
              volume1h: s.volume1h,
              volume24h: s.volume24h,
              liquidity: s.liquidity_usd,
              ageMin: s.age_minutes,
              riskFlags: riskFlags as any,
            },
          });
        }
        return { inserted: snaps.length };
      },
      { connection },
    );
  }
}


