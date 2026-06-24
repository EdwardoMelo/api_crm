import { InstallmentPlanItem, InstallmentPlanStatus, CashFlowType } from '@prisma/client';
import { CashFlowStatus } from '../../../../common/enums';
import { InstallmentPlanWithItems } from '../../repository/InstallmentPlanRepository';

export class InstallmentPlanItemDTOResponse {
  id: number;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: CashFlowStatus;
  paidAt: Date | null;

  static fromEntity(entity: InstallmentPlanItem): InstallmentPlanItemDTOResponse {
    const dto = new InstallmentPlanItemDTOResponse();
    dto.id = entity.id;
    dto.installmentNumber = entity.installmentNumber;
    dto.amount = Number(entity.amount);
    dto.dueDate = entity.dueDate;
    dto.status = entity.status;
    dto.paidAt = entity.paidAt;
    return dto;
  }
}

export class InstallmentPlanDTOResponse {
  id: number;
  description: string;
  type: CashFlowType;
  totalAmount: number;
  installmentCount: number;
  interestRatePercent: number | null;
  firstDueDate: Date;
  category: string | null;
  clientId: number | null;
  projectId: number | null;
  employeeId: number | null;
  status: InstallmentPlanStatus;
  items: InstallmentPlanItemDTOResponse[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: InstallmentPlanWithItems): InstallmentPlanDTOResponse {
    const dto = new InstallmentPlanDTOResponse();
    dto.id = entity.id;
    dto.description = entity.description;
    dto.type = entity.type;
    dto.totalAmount = Number(entity.totalAmount);
    dto.installmentCount = entity.installmentCount;
    dto.interestRatePercent =
      entity.interestRatePercent != null ? Number(entity.interestRatePercent) : null;
    dto.firstDueDate = entity.firstDueDate;
    dto.category = entity.category;
    dto.clientId = entity.clientId;
    dto.projectId = entity.projectId;
    dto.employeeId = entity.employeeId;
    dto.status = entity.status;
    dto.items = entity.items.map((item) => InstallmentPlanItemDTOResponse.fromEntity(item));
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: InstallmentPlanWithItems[]): InstallmentPlanDTOResponse[] {
    return entities.map((entity) => InstallmentPlanDTOResponse.fromEntity(entity));
  }
}
