import { CashFlow } from '@prisma/client';
import { CashFlowSourceType, CashFlowStatus, CashFlowType } from '../../../../common/enums';
import { CashFlowNotaFiscalDTOResponse } from './CashFlowNotaFiscalDTOResponse';

export class CashFlowDTOResponse {
  id: number;
  descricao: string;
  valor: number;
  tipo: CashFlowType;
  status: CashFlowStatus;
  dataCompetencia: Date;
  dataPagamento: Date | null;
  categoria: string | null;
  projectId: number | null;
  clientId: number | null;
  employeeId: number | null;
  budgetId: number | null;
  sourceType: CashFlowSourceType;
  fixedExpenseId: number | null;
  fixedIncomeId: number | null;
  installmentPlanItemId: number | null;
  notaFiscal: CashFlowNotaFiscalDTOResponse | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: CashFlow): CashFlowDTOResponse {
    const dto = new CashFlowDTOResponse();
    dto.id = entity.id;
    dto.descricao = entity.descricao;
    dto.valor = Number(entity.valor);
    dto.tipo = entity.tipo;
    dto.status = entity.status;
    dto.dataCompetencia = entity.dataCompetencia;
    dto.dataPagamento = entity.dataPagamento;
    dto.categoria = entity.categoria;
    dto.projectId = entity.projectId;
    dto.clientId = entity.clientId;
    dto.employeeId = entity.employeeId;
    dto.budgetId = entity.budgetId;
    dto.sourceType = entity.sourceType;
    dto.fixedExpenseId = entity.fixedExpenseId;
    dto.fixedIncomeId = entity.fixedIncomeId;
    dto.installmentPlanItemId = entity.installmentPlanItemId;
    dto.notaFiscal = null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: CashFlow[]): CashFlowDTOResponse[] {
    return entities.map((entity) => CashFlowDTOResponse.fromEntity(entity));
  }
}
