import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { BudgetStatus } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';

export class CreateBudgetDTORequest {
  @IsInt()
  clienteId: number;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titulo: string;

  @IsOptional()
  @Trim()
  @IsString()
  descricao?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsDateString()
  dataValidade?: string;
}
