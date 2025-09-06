import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { ReadModelModule } from '../read-model/read-model.module';

@Module({
  imports: [ReadModelModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
