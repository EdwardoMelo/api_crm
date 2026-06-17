import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Trim } from '../../../../common/decorators';

export class SendBudgetEmailDTORequest {
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
  tituloOrcamento: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @IsOptional()
  @Trim()
  @IsString()
  observacoes?: string;
}
