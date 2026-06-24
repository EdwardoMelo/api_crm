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
import { CashFlowType } from '../../../../common/enums';
import { Trim } from '../../../../common/decorators';

export class CreateInstallmentPlanDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  description: string;

  @IsEnum(CashFlowType)
  type: CashFlowType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;

  @IsInt()
  @Min(1)
  installmentCount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  interestRatePercent?: number;

  @IsDateString()
  firstDueDate: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;

  @IsOptional()
  @IsInt()
  employeeId?: number;
}
