import { Injectable, Inject } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { SOCIAL_QUEUE } from '../queues/bull.module';
import { PrismaService } from '../prisma/prisma.service';
import { SocialProvider, MockSocialProvider, HttpSocialProvider } from './social.provider';

@Injectable()
export class SocialProcessor {
  private provider: SocialProvider;
  constructor(private readonly prisma: PrismaService) {
    // Select provider by env var
    const p = process.env.SOCIAL_PROVIDER || 'mock';
    if (p === 'http') this.provider = new HttpSocialProvider();
    else this.provider = new MockSocialProvider();
  }

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    } as any);
    new Worker(
      SOCIAL_QUEUE,
      async (job) => {
        const { tokenId } = job.data as { tokenId: string };
        const snap = await this.provider.fetch(tokenId);
        await this.prisma.socialSnapshot.create({ data: { tokenId: snap.tokenId, mentions1h: snap.mentions1h, mentions24h: snap.mentions24h, slope: snap.slope, at: snap.at ?? new Date() } });
        return { tokenId };
      },
      { connection },
    );
  }
}


