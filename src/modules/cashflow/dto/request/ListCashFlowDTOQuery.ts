import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CashFlowSourceType, CashFlowStatus, CashFlowType } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';
import { CashFlowSortField } from '../../constants/cash-flow-sort.constants';
import { SortOrder } from '../../../../common/sorting/sort-order.enum';

export class ListCashFlowDTOQuery {  @IsOptional()
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

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  categoria?: string;

  @IsOptional()
  @IsEnum(CashFlowSortField)
  sortBy?: CashFlowSortField;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
