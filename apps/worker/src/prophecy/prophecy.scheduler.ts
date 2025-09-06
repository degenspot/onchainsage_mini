import { Inject, Injectable, Optional, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_PUB } from '../redis/redis.module';
import { CriteriaEngine } from '@onchainsage/scoring/criteria-engine';
import { NarrativeAnalyzer } from '@onchainsage/narrative/narrative-analyzer';
import { getAIProvider, AIProvider } from '@onchainsage/ai/ai-provider';
import { Signal, Token } from '@prisma/client';

@Injectable()
export class ProphecyScheduler {
  private readonly logger = new Logger(ProphecyScheduler.name);
  private criteriaEngine: CriteriaEngine;
  private narrativeAnalyzer: NarrativeAnalyzer;
  private aiProvider: AIProvider;
  private readonly LOCK_KEY = 'prophecy_scheduler_lock_v1';
  private readonly LOCK_TTL = 2 * 60 * 1000; // 2 minutes

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_PUB) private readonly pub: any,
  ) {
    this.criteriaEngine = new CriteriaEngine();
    this.narrativeAnalyzer = new NarrativeAnalyzer();
    this.aiProvider = getAIProvider();
  }

  // Use a Cron job so Nest can manage lifecycle; in dev we still run every 2 minutes.
  // The method attempts to acquire a short Redis lock so only one instance runs the job.
  // CronExpression.EVERY_2_MINUTES doesn't exist in this Nest version; use an explicit 2-minute cron.
  @Cron('0 */2 * * * *')
  async handleCron() {
    try {
      const acquired = await this.acquireLock();
      if (!acquired) {
        this.logger.debug('Did not acquire scheduler lock; skipping run.');
        return;
      }
      await this.runOnce();
    } catch (e) {
      this.logger.error('Prophecy scheduler failed', e as any);
    } finally {
      await this.releaseLock().catch(() => {});
    }
  }

  private async runOnce() {
  this.logger.log('Running prophecy scheduler...');
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    
    // 1. Fetch top signals from the last 24 hours
    const topSignals = await this.prisma.signal.findMany({
      where: { at: { gte: start, lte: end } },
      orderBy: [{ score: 'desc' }],
      take: 50, // Fetch more signals to evaluate against criteria
      include: { token: true }
    });

    const created = [] as any[];

    for (const signal of topSignals) {
      // 2. Fetch latest market and social data for the token
      const marketSnap = await this.getLatestMarketSnapshot(signal.tokenId);
      const socialSnap = await this.getLatestSocialSnapshot(signal.tokenId);

      if (!marketSnap || !socialSnap) continue;

      // 3. Evaluate criteria
      const criteriaResult = this.criteriaEngine.evaluate(marketSnap, socialSnap);
      if (!criteriaResult.passed) continue;

      // 4. Analyze narrative
      const narrativeResult = this.narrativeAnalyzer.analyze(socialSnap, { symbol: signal.token.symbol });
      
      // 5. Generate thesis
      const thesis = await this.aiProvider.generateThesis(
        { ...marketSnap, symbol: signal.token.symbol },
        criteriaResult.matched,
        narrativeResult
      );
      
      // 6. Create prophecy if it doesn't already exist for today
      const rank = created.length + 1;
      const payload = { tokenId: signal.tokenId, score: signal.score, rank };
      const signalHash = this.hash(JSON.stringify(payload));
      
      const prophecyData = {
        tokenId: signal.tokenId,
        signalHash,
        score: signal.score,
        rank,
        criteria: criteriaResult as any, // Cast to 'any' for Prisma
        thesis,
        narrativeScore: narrativeResult.coherence,
        criteriaMatched: criteriaResult.matched as any, // Cast to 'any' for Prisma
        socialSignals: narrativeResult as any,
      };

      // Use create then handle unique constraint failures (idempotent)
      let row: any = null;
      try {
        row = await this.prisma.prophecy.create({ data: prophecyData });
      } catch (err: any) {
        // Prisma will throw an error if unique constraint on signalHash is violated.
        // If so, skip this prophecy as another instance has inserted it.
        const code = err?.code ?? err?.meta?.code;
        if (code === 'P2002' || (err?.message && err.message.includes('UNIQUE constraint failed'))) {
          this.logger.debug(`Prophecy for signalHash ${signalHash} already exists (race).`);
          continue;
        }
        throw err;
      }
      created.push(row);
      
      // Limit to top 3 prophecies per day
      if (created.length >= 3) break;
    }

    if (this.pub && created.length) {
      try {
        await this.pub.publish('prophecies:today', JSON.stringify(created));
  this.logger.log(`Published ${created.length} new prophecies.`);
      } catch(e) {
  this.logger.error('Failed to publish prophecies to Redis:', e as any);
      }
    }
  }

  private async getLatestMarketSnapshot(tokenId: string) {
    return this.prisma.marketSnapshot.findFirst({
      where: { tokenId },
      orderBy: { at: 'desc' },
    });
  }

  private async getLatestSocialSnapshot(tokenId: string) {
    return this.prisma.socialSnapshot.findFirst({
      where: { tokenId },
      orderBy: { at: 'desc' },
    });
  }

  private hash(input: string) {
    // simple non-cryptographic hash for MVP
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
    return `hash_${(h >>> 0).toString(16)}`;
  }

  private async acquireLock(): Promise<boolean> {
    if (!this.pub || !this.pub.set) return true; // if no redis, allow run
    try {
      // SET key value NX PX <ttl>
      const res = await this.pub.set(this.LOCK_KEY, Date.now().toString(), 'NX', 'PX', this.LOCK_TTL);
      return res === 'OK';
    } catch (e) {
      this.logger.debug('Lock acquire failed, assuming single instance', e as any);
      return true;
    }
  }

  private async releaseLock(): Promise<void> {
    if (!this.pub || !this.pub.del) return;
    try {
      await this.pub.del(this.LOCK_KEY);
    } catch (e) {
      this.logger.debug('Lock release failed', e as any);
    }
  }
}


