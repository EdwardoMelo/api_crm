import { IsDateString, IsOptional } from 'class-validator';

export class DashboardSummaryDTOQuery {
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
