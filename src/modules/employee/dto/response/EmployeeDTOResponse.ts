import { Employee } from '@prisma/client';
import { TipoContratacao } from '../../../../common/enums';

export class EmployeeDTOResponse {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cargo: string | null;
  tipoContratacao: TipoContratacao;
  salarioBase: number | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Employee): EmployeeDTOResponse {
    const dto = new EmployeeDTOResponse();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.email = entity.email;
    dto.telefone = entity.telefone;
    dto.cargo = entity.cargo;
    dto.tipoContratacao = entity.tipoContratacao;
    dto.salarioBase = entity.salarioBase === null ? null : Number(entity.salarioBase);
    dto.ativo = entity.ativo;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: Employee[]): EmployeeDTOResponse[] {
    return entities.map((entity) => EmployeeDTOResponse.fromEntity(entity));
  }
}
