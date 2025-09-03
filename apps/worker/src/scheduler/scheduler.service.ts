import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MARKET_QUEUE_TOKEN, SIGNAL_QUEUE_TOKEN } from '../queues/bull.module';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(SIGNAL_QUEUE_TOKEN) private readonly signalQueue: Queue,
    @Inject(MARKET_QUEUE_TOKEN) private readonly marketQueue: Queue,
  ) {}

  // naive interval; in real setup use @nestjs/schedule
  onModuleInit() {
    setInterval(async () => {
      const now = new Date();
      const i = Math.floor(Math.random() * 1000);
      const tokenId = `base:0x${(1000 + i).toString(16)}`;
      const input = {
        mentions1h: Math.round(30 + Math.random() * 100),
        mentions24h: Math.round(200 + Math.random() * 500),
        slope: Math.random() * 2 - 1,
        volume1h: Math.round(5000 + Math.random() * 20000),
        volume24h: Math.round(50_000 + Math.random() * 200_000),
        liquidity: Math.round(20_000 + Math.random() * 200_000),
        ageMin: Math.round(Math.random() * 600),
        riskFlags: Math.random() > 0.8 ? ['low-liq'] : [],
      };
      await this.signalQueue.add('score', { tokenId, input, at: now.toISOString() });
    }, 10000);

    // enqueue a simple market query every minute to build snapshots
    setInterval(async () => {
      await this.marketQueue.add('search', { query: 'base' });
    }, 60_000);
  }
}


