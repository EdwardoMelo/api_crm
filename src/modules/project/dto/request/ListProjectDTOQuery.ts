import { IsEnum, IsOptional } from 'class-validator';
import { ListSortQueryDTO } from '../../../../common/dto/list-sort-query.dto';
import { ProjectSortField } from '../../constants/project-sort.constants';

export class ListProjectDTOQuery extends ListSortQueryDTO {
  @IsOptional()
  @IsEnum(ProjectSortField)
  sortBy?: ProjectSortField;
}
