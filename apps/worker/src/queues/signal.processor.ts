import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_PUB } from '../redis/redis.module';
import { SIGNAL_QUEUE } from './bull.module';

@Injectable()
export class SignalProcessor implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REDIS_PUB) private readonly pub: any,
  ) {}

  onModuleInit() {
    const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    new Worker(
      SIGNAL_QUEUE,
      async (job) => {
        const { tokenId, score, label, at } = job.data as { tokenId: string; score: number; label: string; at: string };
        // Ensure token exists minimally
        const [chain, address] = tokenId.split(':');
        await this.prisma.token.upsert({
          where: { id: tokenId },
          update: {},
          create: { id: tokenId, chain, address },
        });
        const row = await this.prisma.signal.create({
          data: { tokenId, score, label, reasons: ['demo'], at: new Date(at) },
        });
        if (this.pub) {
          try { await this.pub.publish('signals:live', JSON.stringify({ tokenId, score, label, at: row.at.toISOString() })); } catch {}
        }
      },
      { connection },
    );
  }
}


