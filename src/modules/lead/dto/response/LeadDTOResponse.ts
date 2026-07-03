import { Lead } from '@prisma/client';
import { LeadStatus } from '../../../../common/enums';

export class LeadDTOResponse {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  origem: string | null;
  observacoes: string | null;
  status: LeadStatus;
  convertedClientId: number | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Lead): LeadDTOResponse {
    const dto = new LeadDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.email = entity.email;
    dto.telefone = entity.telefone;
    dto.empresa = entity.empresa;
    dto.origem = entity.origem;
    dto.observacoes = entity.observacoes;
    dto.status = entity.status;
    dto.convertedClientId = entity.convertedClientId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Lead[]): LeadDTOResponse[] {
    return entities.map((entity) => LeadDTOResponse.fromEntity(entity));
  }
}
