import { email_templates } from '@prisma/client';
import { EmailTemplateVariableKey } from '../../constants/email-template-variables.constants';

export class EmailTemplateDTOResponse {
  id: number;
  nome: string;
  assunto: string;
  corpo: string;
  variaveis: EmailTemplateVariableKey[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: email_templates): EmailTemplateDTOResponse {
    const dto = new EmailTemplateDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.assunto = entity.assunto;
    dto.corpo = entity.corpo;
    dto.variaveis = JSON.parse(entity.variaveis) as EmailTemplateVariableKey[];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: email_templates[]): EmailTemplateDTOResponse[] {
    return entities.map((entity) => EmailTemplateDTOResponse.fromEntity(entity));
  }
}

export class EmailTemplatePreviewDTOResponse {
  assunto: string;
  corpo: string;
  variaveis: string[];
}
