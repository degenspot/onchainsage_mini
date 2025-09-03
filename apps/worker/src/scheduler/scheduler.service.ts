import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SIGNAL_QUEUE_TOKEN } from '../queues/bull.module';

@Injectable()
export class SchedulerService {
  constructor(@Inject(SIGNAL_QUEUE_TOKEN) private readonly signalQueue: Queue) {}

  // naive interval; in real setup use @nestjs/schedule
  onModuleInit() {
    setInterval(async () => {
      const now = new Date();
      const i = Math.floor(Math.random() * 1000);
      const tokenId = `base:0x${(1000 + i).toString(16)}`;
      await this.signalQueue.add('demo', {
        tokenId,
        score: Math.round((Math.random() * 3 + 0.5) * 100) / 100,
        label: (['HYPE_BUILDING','FAKE_PUMP','DEAD_ZONE','WHALE_PLAY'] as const)[i % 4],
        at: now.toISOString(),
      });
    }, 10000);
  }
}


