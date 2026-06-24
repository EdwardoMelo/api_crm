import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../../common/decorators';

export class CreateFixedIncomeDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDayOfMonth: number;

  @IsDateString()
  startsOn: string;

  @IsDateString()
  endsOn: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;
}

export class UpdateFixedIncomeDTORequest {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDayOfMonth?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;
}

export class RenewFixedIncomeDTORequest {
  @IsDateString()
  startsOn: string;

  @IsDateString()
  endsOn: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDayOfMonth?: number;
}
