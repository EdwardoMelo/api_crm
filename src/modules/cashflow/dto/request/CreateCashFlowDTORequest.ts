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
import { CashFlowStatus, CashFlowType } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';

export class CreateCashFlowDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  descricao: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @IsEnum(CashFlowType)
  tipo: CashFlowType;

  @IsOptional()
  @IsEnum(CashFlowStatus)
  status?: CashFlowStatus;

  @IsDateString()
  dataCompetencia: string;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  categoria?: string;

  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  employeeId?: number;
}
