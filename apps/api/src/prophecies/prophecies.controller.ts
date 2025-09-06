import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ReadModelService } from '../read-model/read-model.service';

@Controller('prophecies')
export class PropheciesController {
  constructor(private readonly readModel: ReadModelService) {}

  @Get('today')
  async getToday() {
    return this.readModel.getTodayProphecies();
  }

  @Get('weekly')
  async getWeekly(@Query('from') from?: string, @Query('to') to?: string) {
    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;
    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) throw new BadRequestException('Invalid from date');
      fromDate = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime())) throw new BadRequestException('Invalid to date');
      toDate = d;
    }
    return this.readModel.getWeeklyProphecyCounts(fromDate, toDate);
  }
}


