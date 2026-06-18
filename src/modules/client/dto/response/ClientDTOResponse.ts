import { Client } from '@prisma/client';
import { ClientWithMetrics } from '../../types/client-with-metrics.type';

export class ClientDTOResponse {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  documento: string | null;
  observacoes: string | null;
  valorOrcado: number;
  valorVendido: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Client, metrics?: { valorOrcado: number; valorVendido: number }): ClientDTOResponse {
    const dto = new ClientDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.email = entity.email;
    dto.telefone = entity.telefone;
    dto.empresa = entity.empresa;
    dto.documento = entity.documento;
    dto.observacoes = entity.observacoes;
    dto.valorOrcado = metrics?.valorOrcado ?? 0;
    dto.valorVendido = metrics?.valorVendido ?? 0;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntityWithMetrics(entity: ClientWithMetrics): ClientDTOResponse {
    return ClientDTOResponse.fromEntity(entity, {
      valorOrcado: entity.valorOrcado,
      valorVendido: entity.valorVendido,
    });
  }

  static fromEntities(entities: ClientWithMetrics[]): ClientDTOResponse[] {
    return entities.map((entity) => ClientDTOResponse.fromEntityWithMetrics(entity));
  }
}
