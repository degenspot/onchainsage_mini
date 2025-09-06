import { Controller, Get } from '@nestjs/common';
import { ReadModelService } from '../read-model/read-model.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly readModel: ReadModelService) {}

  @Get('overview')
  async getOverview() {
    return this.readModel.getDashboardOverview();
  }
}
