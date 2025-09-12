import { Inject, Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { MARKET_QUEUE, SIGNAL_QUEUE_TOKEN, SOCIAL_QUEUE_TOKEN } from '../queues/bull.module';
import { PrismaService } from '../prisma/prisma.service';
import { fetchPairsByQuery, fetchTrendingPairs, JobKind, TrendingTimeframe } from '../connectors/dexscreener';
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
        const start = Date.now();
        const jobData = job.data as { kind?: JobKind; query?: string; timeframe?: TrendingTimeframe };
        const kind: JobKind = (jobData.kind as JobKind) || 'search';
        try {
          let snaps = [] as any[];
          if (kind === 'search') {
            const q = jobData.query || 'base';
            snaps = await fetchPairsByQuery(q);
          } else if (kind === 'trending') {
            const tf = (jobData.timeframe as TrendingTimeframe) || '24h';
            snaps = await fetchTrendingPairs(tf);
          }

          // batch upserts for tokens
          const batch = [] as any[];
          for (const s of snaps) {
            // defensive: skip incomplete snaps to avoid invalid DB writes (e.g., address undefined)
            if (!s || !s.address || !s.chainId) {
              console.warn('[market.processor] skipping incomplete snap', { snap: s });
              continue;
            }
            const addr = String(s.address);
            const tokenId = `${s.chainId}:${addr}`;
            // ensure address is normalized on the object we store/use downstream
            batch.push({ tokenId, s: { ...s, address: addr } });
          }

          // process in small batches to avoid DB too large transactions
          const BATCH_SIZE = 25;
          for (let i = 0; i < batch.length; i += BATCH_SIZE) {
            const chunk = batch.slice(i, i + BATCH_SIZE);
            // Build a single transaction containing both upserts and snapshot creates
            const txOps = [] as any[];
            for (const item of chunk) {
              const s = item.s;
              txOps.push(
                this.prisma.token.upsert({
                  where: { id: item.tokenId },
                  update: {},
                  create: { id: item.tokenId, chain: item.s.chainId, address: item.s.address },
                }),
              );
              txOps.push(
                this.prisma.marketSnapshot.create({
                  data: {
                    tokenId: item.tokenId,
                    volume1h: s.volume1h,
                    volume24h: s.volume24h,
                    liquidity: s.liquidity_usd,
                    price: s.price,
                    ageMin: s.age_minutes,
                  },
                }),
              );
            }
            // execute as one atomic transaction for the whole chunk
            await this.prisma.$transaction(txOps as any[]);

            // risk analysis and queueing are performed after DB commit to avoid long transactions
            for (const item of chunk) {
              const s = item.s;
              // risk analysis with error handling
              let riskFlags: any = [];
              try {
                riskFlags = await this.riskAnalyzer.analyze(s.address, s.chainId);
              } catch (e) {
                console.error('[market.processor] risk analyzer failed', String(e));
              }

              try {
                await this.socialQueue.add('social-stub', { tokenId: item.tokenId });
                await this.signalQueue.add('score-from-market', {
                  tokenId: item.tokenId,
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
              } catch (e) {
                console.error('[market.processor] enqueue failed', String(e));
              }
            }
          }

          const duration = Date.now() - start;
          console.info('[market.processor] job complete', { jobId: job.id, kind, inserted: snaps.length, duration });
          return { inserted: snaps.length };
        } catch (e) {
          console.error('[market.processor] job error', { jobId: job.id, data: jobData, err: String(e) });
          throw e;
        }
      },
      { connection },
    );
  }
}


