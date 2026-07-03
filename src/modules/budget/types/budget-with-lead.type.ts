import { Budget, Lead } from '@prisma/client';

export type BudgetWithLead = Budget & {
  lead?: Lead | null;
};
