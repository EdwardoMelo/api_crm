import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../../common/decorators';
import { EmailTemplateVariableKey } from '../../constants/email-template-variables.constants';

export class CreateEmailTemplateDTORequest {
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
  variaveis?: EmailTemplateVariableKey[];
}

export class UpdateEmailTemplateDTORequest {
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
  variaveis?: EmailTemplateVariableKey[];
}

export class PreviewEmailTemplateBodyDTORequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo: string;
}
