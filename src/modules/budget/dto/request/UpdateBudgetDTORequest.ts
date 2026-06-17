import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDTORequest } from './CreateBudgetDTORequest';

export class UpdateBudgetDTORequest extends PartialType(CreateBudgetDTORequest) {}
