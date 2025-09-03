import { Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { SOCIAL_QUEUE } from '../queues/bull.module';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialProcessor {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    } as any);
    new Worker(
      SOCIAL_QUEUE,
      async (job) => {
        const { tokenId } = job.data as { tokenId: string };
        // Stub: deterministic counts based on tokenId hash
        const h = [...tokenId].reduce((a, c) => a + c.charCodeAt(0), 0);
        const mentions1h = (h % 120) + 10;
        const mentions24h = mentions1h * 10 + (h % 50);
        const slope = ((h % 20) - 10) / 10;
        await this.prisma.socialSnapshot.create({
          data: { tokenId, mentions1h, mentions24h, slope, at: new Date() },
        });
        return { tokenId };
      },
      { connection },
    );
  }
}


