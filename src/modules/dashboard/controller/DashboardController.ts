import { Controller, Get, Query } from '@nestjs/common';
import { DashboardSummaryDTOQuery } from '../dto/request/DashboardSummaryDTOQuery';
import { DashboardSummaryDTOResponse } from '../dto/response/DashboardSummaryDTOResponse';
import { DashboardService } from '../service/DashboardService';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardSummaryDTOQuery): Promise<DashboardSummaryDTOResponse> {
    return this.dashboardService.getSummary(query);
  }
}
