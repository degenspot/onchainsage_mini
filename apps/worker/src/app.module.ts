import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { MockSignalPublisher } from './publisher/mock-signal.publisher';
import { BullModule } from './queues/bull.module';
import { SchedulerService } from './scheduler/scheduler.service';
import { SignalProcessor } from './queues/signal.processor';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [RedisModule, BullModule],
  controllers: [AppController],
  providers: [AppService, MockSignalPublisher, SchedulerService, SignalProcessor, PrismaService],
})
export class AppModule {}
