import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

export const SIGNAL_QUEUE = 'signal';
export const SIGNAL_QUEUE_TOKEN = Symbol('SIGNAL_QUEUE');
export const MARKET_QUEUE = 'market';
export const MARKET_QUEUE_TOKEN = Symbol('MARKET_QUEUE');
export const SOCIAL_QUEUE = 'social';
export const SOCIAL_QUEUE_TOKEN = Symbol('SOCIAL_QUEUE');

@Global()
@Module({
  providers: [
    {
      provide: SIGNAL_QUEUE_TOKEN,
      useFactory: () => {
        const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
        } as any);
        return new Queue(SIGNAL_QUEUE, { connection });
      },
    },
    {
      provide: MARKET_QUEUE_TOKEN,
      useFactory: () => {
        const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
        } as any);
        return new Queue(MARKET_QUEUE, { connection });
      },
    },
    {
      provide: SOCIAL_QUEUE_TOKEN,
      useFactory: () => {
        const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
        } as any);
        return new Queue(SOCIAL_QUEUE, { connection });
      },
    },
  ],
  exports: [SIGNAL_QUEUE_TOKEN, MARKET_QUEUE_TOKEN, SOCIAL_QUEUE_TOKEN],
})
export class BullModule {}


