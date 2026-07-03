// Reexporta os enums gerados pelo Prisma para serem usados em DTOs e validações.
// Mantém uma única fonte de verdade (o schema.prisma) e evita divergência de valores.
export {
  TipoContratacao,
  BudgetStatus,
  ProjectStatus,
  CashFlowType,
  CashFlowStatus,
  CashFlowSourceType,
  InstallmentPlanStatus,
  EmailStatus,
  LeadStatus,
  users_role as UserRole,
} from '@prisma/client';
