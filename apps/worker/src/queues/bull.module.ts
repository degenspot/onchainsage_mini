import { Global, Module } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export const SIGNAL_QUEUE = 'signal';
export const SIGNAL_QUEUE_TOKEN = Symbol('SIGNAL_QUEUE');

@Global()
@Module({
  providers: [
    {
      provide: SIGNAL_QUEUE_TOKEN,
      useFactory: () => {
        const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        return new Queue(SIGNAL_QUEUE, { connection });
      },
    },
  ],
  exports: [SIGNAL_QUEUE_TOKEN],
})
export class BullModule {}


