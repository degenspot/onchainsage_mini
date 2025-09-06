import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ReadModelService } from '../read-model/read-model.service';

interface TopSignalDto {
  tokenId: string;
  chain: string;
  address: string;
  symbol?: string;
  score: number;
  label: 'HYPE_BUILDING' | 'FAKE_PUMP' | 'DEAD_ZONE' | 'WHALE_PLAY';
  at: string;
}

@Controller('signals')
export class SignalsController {
  constructor(private readonly readModel: ReadModelService) {}

  @Get('top')
  async getTop(
    @Query('window') window = '24h',
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<TopSignalDto[]> {
    const w = (['1h', '24h', '7d'] as const).includes(window as any) ? (window as any) : '24h';
    const n = Math.min(limit ?? 5, 50);
    return this.readModel.getTopSignals({ window: w, limit: n });
  }

  @Get(':chain/:address')
  async getTokenSignals(
    @Param('chain') chain: string,
    @Param('address') address: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.readModel.getTokenSignals(chain, address, limit ?? 20);
  }

  @Get('history')
  async getHistory(@Query('window') window = '7d', @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    const w = (['7d', '30d', '90d'] as const).includes(window as any) ? (window as any) : '7d';
    return this.readModel.getSignalHistory({ window: w, limit });
  }
}
