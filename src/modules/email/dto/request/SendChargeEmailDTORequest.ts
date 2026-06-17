import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Trim } from '../../../../common/decorators';

export class SendChargeEmailDTORequest {
  @Trim()
  @IsEmail()
  destinatario: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  clienteNome: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;
}
