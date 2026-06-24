import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { BudgetSortField } from '../../constants/budget-sort.constants';

export class ListBudgetDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(BudgetSortField)
  sortBy?: BudgetSortField;
}
