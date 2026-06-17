import { Client } from '@prisma/client';

export class ClientDTOResponse {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  documento: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Client): ClientDTOResponse {
    const dto = new ClientDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.email = entity.email;
    dto.telefone = entity.telefone;
    dto.empresa = entity.empresa;
    dto.documento = entity.documento;
    dto.observacoes = entity.observacoes;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Client[]): ClientDTOResponse[] {
    return entities.map((entity) => ClientDTOResponse.fromEntity(entity));
  }
}
