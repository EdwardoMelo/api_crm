import { FixedExpense } from '@prisma/client';
import { FixedItemLifecycleStatus } from '../../constants/fixed-item.constants';
import { computeFixedItemLifecycle } from '../../utils/fixed-item-lifecycle.utils';

export class FixedExpenseDTOResponse {
  id: number;
  description: string;
  amount: number;
  category: string | null;
  dueDayOfMonth: number;
  startsOn: Date;
  endsOn: Date;
  active: boolean;
  employeeId: number | null;
  renewedFromId: number | null;
  lifecycleStatus: FixedItemLifecycleStatus;
  daysUntilEnd: number;
  renewalEligible: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: FixedExpense): FixedExpenseDTOResponse {
    const lifecycle = computeFixedItemLifecycle(entity);
    const dto = new FixedExpenseDTOResponse();
    dto.id = entity.id;
    dto.description = entity.description;
    dto.amount = Number(entity.amount);
    dto.category = entity.category;
    dto.dueDayOfMonth = entity.dueDayOfMonth;
    dto.startsOn = entity.startsOn;
    dto.endsOn = entity.endsOn;
    dto.active = entity.active;
    dto.employeeId = entity.employeeId;
    dto.renewedFromId = entity.renewedFromId;
    dto.lifecycleStatus = lifecycle.lifecycleStatus;
    dto.daysUntilEnd = lifecycle.daysUntilEnd;
    dto.renewalEligible = lifecycle.renewalEligible;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: FixedExpense[]): FixedExpenseDTOResponse[] {
    return entities.map((entity) => FixedExpenseDTOResponse.fromEntity(entity));
  }
}
