import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalsModule } from './signals/signals.module';
import { ReadModelModule } from './read-model/read-model.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PropheciesController } from './prophecies/prophecies.controller';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [SignalsModule, ReadModelModule, DashboardModule, HealthModule, RedisModule],
  controllers: [AppController, PropheciesController],
  providers: [AppService],
})
export class AppModule {}
