import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoContratacao } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';

export class CreateEmployeeDTORequest {
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
  @MaxLength(120)
  cargo?: string;

  @IsEnum(TipoContratacao)
  tipoContratacao: TipoContratacao;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salarioBase?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
