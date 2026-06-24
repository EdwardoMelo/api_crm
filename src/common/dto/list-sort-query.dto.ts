import { IsEnum, IsOptional } from 'class-validator';
import { SortOrder } from '../sorting/sort-order.enum';

export class ListSortQueryDTO {
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
