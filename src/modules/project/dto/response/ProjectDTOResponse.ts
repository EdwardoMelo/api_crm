import { Project } from '@prisma/client';
import { ProjectStatus } from '../../../../common/enums';

export class ProjectDTOResponse {
  id: number;
  clienteId: number;
  budgetId: number | null;
  titulo: string;
  descricao: string | null;
  valorTotal: number;
  status: ProjectStatus;
  dataInicio: Date | null;
  dataFimPrevista: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Project): ProjectDTOResponse {
    const dto = new ProjectDTOResponse();
    dto.id = entity.id;
    dto.clienteId = entity.clienteId;
    dto.budgetId = entity.budgetId;
    dto.titulo = entity.titulo;
    dto.descricao = entity.descricao;
    dto.valorTotal = Number(entity.valorTotal);
    dto.status = entity.status;
    dto.dataInicio = entity.dataInicio;
    dto.dataFimPrevista = entity.dataFimPrevista;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Project[]): ProjectDTOResponse[] {
    return entities.map((entity) => ProjectDTOResponse.fromEntity(entity));
  }
}
