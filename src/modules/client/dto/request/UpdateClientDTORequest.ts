import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDTORequest } from './CreateClientDTORequest';

export class UpdateClientDTORequest extends PartialType(CreateClientDTORequest) {}
