import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { FixedIncomeSortField } from '../../constants/fixed-income-sort.constants';

export class ListFixedIncomeDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(FixedIncomeSortField)
  sortBy?: FixedIncomeSortField;
}
