import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { InstallmentPlanSortField } from '../../constants/installment-plan-sort.constants';

export class ListInstallmentPlanDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(InstallmentPlanSortField)
  sortBy?: InstallmentPlanSortField;
}
