import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { ClientSortField } from '../../constants/client-sort.constants';

export class ListClientDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(ClientSortField)
  sortBy?: ClientSortField;
}
