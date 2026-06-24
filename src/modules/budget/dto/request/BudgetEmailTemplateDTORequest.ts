import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../../common/decorators';
import { BudgetEmailVariableKey } from '../../constants/budget-email-variables.constants';

export class CreateBudgetEmailTemplateDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo: string;

  @IsOptional()
  variaveis?: BudgetEmailVariableKey[];
}

export class UpdateBudgetEmailTemplateDTORequest {
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo?: string;

  @IsOptional()
  variaveis?: BudgetEmailVariableKey[];
}

export class PreviewBudgetEmailTemplateDTORequest {
  @IsInt()
  budgetId: number;

  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo: string;
}
