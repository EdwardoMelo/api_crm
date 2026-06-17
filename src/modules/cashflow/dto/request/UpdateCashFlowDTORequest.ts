import { PartialType } from '@nestjs/mapped-types';
import { CreateCashFlowDTORequest } from './CreateCashFlowDTORequest';

export class UpdateCashFlowDTORequest extends PartialType(CreateCashFlowDTORequest) {}
