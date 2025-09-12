import { Injectable, Inject } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { SOCIAL_QUEUE } from '../queues/bull.module';
import { PrismaService } from '../prisma/prisma.service';
import { SocialProvider, MockSocialProvider, HttpSocialProvider } from './social.provider';
import { SentimentAnalyzer } from '@onchainsage/ai';

@Injectable()
export class SocialProcessor {
  private provider: SocialProvider;
  private sentimentAnalyzer: SentimentAnalyzer | null = null;
  constructor(private readonly prisma: PrismaService) {
    // Select provider by env var
    const p = process.env.SOCIAL_PROVIDER || 'mock';
  if (p === 'http') this.provider = new HttpSocialProvider();
  else if (p === 'twitter') this.provider = new (require('./social.provider').TwitterSocialProvider)();
  else this.provider = new MockSocialProvider();
    // init sentiment analyzer if API key present
    try {
      this.sentimentAnalyzer = new SentimentAnalyzer();
    } catch (e) {
      // will continue without sentiment
      this.sentimentAnalyzer = null;
    }
  }

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    } as any);
    new Worker(
      SOCIAL_QUEUE,
      async (job) => {
        const { tokenId } = job.data as { tokenId: string };
        // try to resolve token symbol from db and prefer provider.fetchBySymbol when available
        const token = await this.prisma.token.findUnique({ where: { id: tokenId }, select: { symbol: true } });
        let snap: any;
        if ((this.provider as any).fetchBySymbol && token?.symbol) {
          snap = await (this.provider as any).fetchBySymbol(tokenId, token.symbol);
        } else {
          snap = await this.provider.fetch(tokenId);
        }

        // persist social snapshot and tweets (if any) atomically
        const tweets = (snap as any).tweets || [];
        // prepare sentiment analysis
        let results: any[] = [];
        let aggregated: any = null;
        if (tweets && tweets.length && this.sentimentAnalyzer) {
          try {
            const texts = tweets.map((t: any) => (t && t.text ? String(t.text) : ''));
            // limit batch sizes to analyzer.batchSize (default inside analyzer)
            results = await this.sentimentAnalyzer.analyzeBatch(texts);
            aggregated = this.sentimentAnalyzer.aggregateSentiments(results);
            if (process.env.DEBUG_DEX) console.debug('[social.processor] sentiment aggregated', aggregated);
          } catch (e) {
            console.warn('[social.processor] sentiment analysis failed', String(e));
            results = [];
            aggregated = null;
          }
        }

        try {
          await this.prisma.$transaction(async (tx) => {
            // include sentiment aggregation when available
            const snapData: any = { tokenId: snap.tokenId, mentions1h: snap.mentions1h, mentions24h: snap.mentions24h, slope: snap.slope, at: snap.at ?? new Date() };
            if (aggregated) {
              snapData.sentimentScore = aggregated.averageScore;
              snapData.positiveRatio = aggregated.positiveRatio;
              snapData.negativeRatio = aggregated.negativeRatio;
              snapData.sentimentAnalyzed = aggregated.totalAnalyzed;
            }
            await tx.socialSnapshot.create({ data: snapData });

            if (tweets && tweets.length) {
              const chunks = (arr: any[], size: number) =>
                arr.reduce((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), [] as any[][]);

              const valid = tweets
                .map((t: any, i: number) => ({ t, i }))
                .filter(({ t }) => t && t.tweetId && String(t.tweetId).trim().length > 0);

              for (const group of chunks(valid, 50)) {
                await Promise.all(
                  group.map(({ t, i }) => {
                    const sentiment = results[i] || null;
                    const txAny: any = tx as any;
                    return txAny.tweet.upsert({
                      where: { tweetId: t.tweetId },
                      update: {
                        text: t.text,
                        author: t.author,
                        authorDisplayName: t.authorDisplayName,
                        createdAt: new Date(t.createdAt),
                        collectedAt: new Date(),
                        likes: t.metrics?.likes || 0,
                        retweets: t.metrics?.retweets || 0,
                        replies: t.metrics?.replies || 0,
                        relevanceScore: 0,
                        sentimentLabel: sentiment?.label,
                        sentimentScore: sentiment?.confidence,
                        sentimentAnalyzedAt: sentiment ? new Date() : undefined,
                      },
                      create: {
                        tweetId: t.tweetId,
                        tokenId: tokenId,
                        text: t.text,
                        author: t.author,
                        authorDisplayName: t.authorDisplayName,
                        createdAt: new Date(t.createdAt),
                        collectedAt: new Date(),
                        likes: t.metrics?.likes || 0,
                        retweets: t.metrics?.retweets || 0,
                        replies: t.metrics?.replies || 0,
                        relevanceScore: 0,
                        sentimentLabel: sentiment?.label,
                        sentimentScore: sentiment?.confidence,
                        sentimentAnalyzedAt: sentiment ? new Date() : undefined,
                      },
                    });
                  }),
                );
              }
            }
          });
        } catch (e) {
          console.error('[social.processor] failed to persist tweets/snapshot', String(e));
        }

        return { tokenId };
      },
      { connection },
    );
  }
}


