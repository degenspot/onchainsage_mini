import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { MockSignalPublisher } from './publisher/mock-signal.publisher';
import { BullModule } from './queues/bull.module';
import { SchedulerService } from './scheduler/scheduler.service';
import { SignalProcessor } from './queues/signal.processor';
import { PrismaService } from './prisma/prisma.service';
import { MarketProcessor } from './ingest/market.processor';
import { SocialProcessor } from './ingest/social.processor';
import { ProphecyScheduler } from './prophecy/prophecy.scheduler';

@Module({
  imports: [RedisModule, BullModule],
  controllers: [AppController],
  providers: [AppService, MockSignalPublisher, SchedulerService, SignalProcessor, PrismaService, MarketProcessor, SocialProcessor, ProphecyScheduler],
})
export class AppModule {}
