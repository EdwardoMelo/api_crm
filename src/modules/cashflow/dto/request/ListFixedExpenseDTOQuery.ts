import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { FixedExpenseSortField } from '../../constants/fixed-expense-sort.constants';

export class ListFixedExpenseDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(FixedExpenseSortField)
  sortBy?: FixedExpenseSortField;
}
