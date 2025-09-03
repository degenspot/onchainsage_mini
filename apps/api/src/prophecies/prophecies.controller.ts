import { Controller, Get } from '@nestjs/common';
import { ReadModelService } from '../read-model/read-model.service';

@Controller('prophecies')
export class PropheciesController {
  constructor(private readonly readModel: ReadModelService) {}

  @Get('today')
  async getToday() {
    return this.readModel.getTodayProphecies();
  }
}


