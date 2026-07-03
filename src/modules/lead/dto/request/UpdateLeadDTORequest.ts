import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDTORequest } from './CreateLeadDTORequest';

export class UpdateLeadDTORequest extends PartialType(CreateLeadDTORequest) {}
