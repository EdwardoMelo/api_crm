import { IsEnum, IsOptional } from 'class-validator';
import { CashFlowType } from '../../../../common/enums';

export class ListCashFlowCategoryDTOQuery {
  @IsOptional()
  @IsEnum(CashFlowType)
  tipo?: CashFlowType;
}
