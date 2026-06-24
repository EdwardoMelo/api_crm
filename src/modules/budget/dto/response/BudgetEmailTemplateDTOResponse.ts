import { budget_email_templates } from '@prisma/client';
import { BudgetEmailVariableKey } from '../../constants/budget-email-variables.constants';

export class BudgetEmailTemplateDTOResponse {
  id: number;
  nome: string;
  assunto: string;
  corpo: string;
  variaveis: BudgetEmailVariableKey[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: budget_email_templates): BudgetEmailTemplateDTOResponse {
    const dto = new BudgetEmailTemplateDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.assunto = entity.assunto;
    dto.corpo = entity.corpo;
    dto.variaveis = JSON.parse(entity.variaveis) as BudgetEmailVariableKey[];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: budget_email_templates[]): BudgetEmailTemplateDTOResponse[] {
    return entities.map((entity) => BudgetEmailTemplateDTOResponse.fromEntity(entity));
  }
}
