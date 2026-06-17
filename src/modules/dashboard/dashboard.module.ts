import { Module } from '@nestjs/common';
import { DashboardController } from './controller/DashboardController';
import { DashboardRepository } from './repository/DashboardRepository';
import { DashboardService } from './service/DashboardService';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
  exports: [DashboardService],
})
export class DashboardModule {}
