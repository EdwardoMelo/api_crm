import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { EmployeeSortField } from '../../constants/employee-sort.constants';

export class ListEmployeeDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(EmployeeSortField)
  sortBy?: EmployeeSortField;
}
