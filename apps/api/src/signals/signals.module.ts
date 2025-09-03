import { Module } from '@nestjs/common';
import { SignalsController } from './signals.controller';
import { SignalsGateway } from './signals.gateway';
import { ReadModelModule } from '../read-model/read-model.module';

@Module({
  imports: [ReadModelModule],
  controllers: [SignalsController],
  providers: [SignalsGateway],
})
export class SignalsModule {}
