import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { REDIS_PUB } from '../redis/redis.module';

@Injectable()
export class MockSignalPublisher implements OnModuleInit {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(@Optional() @Inject(REDIS_PUB) private readonly pub: any) {}

  onModuleInit() {
    if (!this.pub) return; // no redis; do nothing
    this.intervalHandle = setInterval(async () => {
      const now = new Date();
      const i = Math.floor(Math.random() * 1000);
      const payload = {
        tokenId: `base:0x${(1000 + i).toString(16)}`,
        score: Math.round((Math.random() * 3 + 0.5) * 100) / 100,
        label: (['HYPE_BUILDING','FAKE_PUMP','DEAD_ZONE','WHALE_PLAY'] as const)[i % 4],
        at: now.toISOString(),
      };
      try {
        await this.pub.publish('signals:live', JSON.stringify(payload));
      } catch {}
    }, 7000);
  }
}


