import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDTORequest } from './CreateProjectDTORequest';

export class UpdateProjectDTORequest extends PartialType(CreateProjectDTORequest) {}
