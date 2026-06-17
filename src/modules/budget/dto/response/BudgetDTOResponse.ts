import { Budget } from '@prisma/client';
import { BudgetStatus } from '../../../../common/enums';

export class BudgetDTOResponse {
  id: number;
  clienteId: number;
  titulo: string;
  descricao: string | null;
  valor: number;
  status: BudgetStatus;
  dataValidade: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Budget): BudgetDTOResponse {
    const dto = new BudgetDTOResponse();
    dto.id = entity.id;
    dto.clienteId = entity.clienteId;
    dto.titulo = entity.titulo;
    dto.descricao = entity.descricao;
    dto.valor = Number(entity.valor);
    dto.status = entity.status;
    dto.dataValidade = entity.dataValidade;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Budget[]): BudgetDTOResponse[] {
    return entities.map((entity) => BudgetDTOResponse.fromEntity(entity));
  }
}
