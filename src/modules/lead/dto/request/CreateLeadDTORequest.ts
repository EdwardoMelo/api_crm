import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadStatus } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';

export class CreateLeadDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  nome: string;

  @IsOptional()
  @Trim()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(40)
  telefone?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(180)
  empresa?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  origem?: string;

  @IsOptional()
  @Trim()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
