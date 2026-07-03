import { BudgetStatus, LeadStatus } from '../../../../common/enums';
import { BudgetWithLead } from '../../types/budget-with-lead.type';

export class BudgetLeadSummaryDTOResponse {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  status: LeadStatus;
  convertedClientId: number | null;
}

export class BudgetDTOResponse {
  id: number;
  clienteId: number | null;
  leadId: number | null;
  lead: BudgetLeadSummaryDTOResponse | null;
  titulo: string;
  descricao: string | null;
  valor: number;
  status: BudgetStatus;
  dataValidade: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: BudgetWithLead): BudgetDTOResponse {
    const dto = new BudgetDTOResponse();
    dto.id = entity.id;
    dto.clienteId = entity.clienteId;
    dto.leadId = entity.leadId;
    dto.lead = entity.lead
      ? {
          id: entity.lead.id,
          nome: entity.lead.nome,
          email: entity.lead.email,
          telefone: entity.lead.telefone,
          empresa: entity.lead.empresa,
          status: entity.lead.status,
          convertedClientId: entity.lead.convertedClientId,
        }
      : null;
    dto.titulo = entity.titulo;
    dto.descricao = entity.descricao;
    dto.valor = Number(entity.valor);
    dto.status = entity.status;
    dto.dataValidade = entity.dataValidade;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: BudgetWithLead[]): BudgetDTOResponse[] {
    return entities.map((entity) => BudgetDTOResponse.fromEntity(entity));
  }
}
