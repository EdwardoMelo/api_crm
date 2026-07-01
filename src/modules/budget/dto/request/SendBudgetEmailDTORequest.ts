import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim } from '../../../../common/decorators';

export class SendBudgetEmailDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsInt()
  templateId?: number;
}
