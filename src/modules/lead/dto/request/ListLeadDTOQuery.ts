import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { LeadSortField } from '../../constants/lead-sort.constants';

export class ListLeadDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(LeadSortField)
  sortBy?: LeadSortField;
}
