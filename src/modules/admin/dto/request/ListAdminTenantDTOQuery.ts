import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { AdminTenantSortField } from '../../constants/admin-tenant-sort.constants';

export class ListAdminTenantDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(AdminTenantSortField)
  sortBy?: AdminTenantSortField;
}
