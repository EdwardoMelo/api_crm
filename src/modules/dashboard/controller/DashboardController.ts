import { Controller, Get } from '@nestjs/common';
import { DashboardSummaryDTOResponse } from '../dto/response/DashboardSummaryDTOResponse';
import { DashboardService } from '../service/DashboardService';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(): Promise<DashboardSummaryDTOResponse> {
    return this.dashboardService.getSummary();
  }
}
