import { Global, Module } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

export const REDIS_PUB = Symbol('REDIS_PUB');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_PUB,
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) return null;
        const options: RedisOptions = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            return Math.min(times * 200, 2000);
          },
        } as any;
        const client = new Redis(url, options);
        client.on('error', () => {});
        client.connect().catch(() => {});
        return client;
      },
    },
  ],
  exports: [REDIS_PUB],
})
export class RedisModule {}


