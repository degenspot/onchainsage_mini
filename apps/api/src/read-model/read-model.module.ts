import { Module } from '@nestjs/common';
import { ReadModelService } from './read-model.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ReadModelService, PrismaService],
  exports: [ReadModelService],
})
export class ReadModelModule {}


