import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CashFlowSourceType, CashFlowStatus, CashFlowType } from '../../../../common/enums';

export class ListCashFlowDTOQuery {
  @IsOptional()
  @IsEnum(CashFlowType)
  tipo?: CashFlowType;

  @IsOptional()
  @IsEnum(CashFlowStatus)
  status?: CashFlowStatus;

  @IsOptional()
  @IsEnum(CashFlowSourceType)
  sourceType?: CashFlowSourceType;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
