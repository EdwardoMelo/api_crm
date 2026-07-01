import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EMAIL_TEMPLATE_TONES } from '../../constants/email-template-tone.constants';

export class EmailTemplateVariableInputDTO {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class SuggestEmailTemplateDTORequest {
  @IsEnum(EMAIL_TEMPLATE_TONES)
  tone: (typeof EMAIL_TEMPLATE_TONES)[number];

  @ValidateNested({ each: true })
  @Type(() => EmailTemplateVariableInputDTO)
  @ArrayMinSize(1)
  variables: EmailTemplateVariableInputDTO[];
}
