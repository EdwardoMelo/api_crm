import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../../common/decorators';

/**
 * Dados densos capturados no momento de promover um Lead a Cliente.
 * Espelha os campos de criação de cliente (nome e e-mail obrigatórios).
 */
export class ConvertLeadDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  nome: string;

  @Trim()
  @IsEmail()
  @MaxLength(180)
  email: string;

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
  @MaxLength(40)
  documento?: string;

  @IsOptional()
  @Trim()
  @IsString()
  observacoes?: string;
}
