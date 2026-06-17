import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDTORequest } from './CreateEmployeeDTORequest';

export class UpdateEmployeeDTORequest extends PartialType(CreateEmployeeDTORequest) {}
