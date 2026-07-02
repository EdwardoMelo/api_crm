import { PrismaClient } from '@prisma/client';
import { SYSTEM_ACTOR } from '../common/audit/audit.constants';
import { E2E_REGISTER_EMAIL_DOMAIN } from './e2e-test.constants';

/**
 * Remove tenants criados pelo seed/e2e (createdBy = 'system'), contas de teste de
 * registro (@daitx.test) e todos os dados vinculados. Tenants reais são preservados.
 */
export async function cleanSystemData(prisma: PrismaClient): Promise<void> {
  const [systemTenants, registerTestUsers] = await Promise.all([
    prisma.tenants.findMany({
      where: { createdBy: SYSTEM_ACTOR },
      select: { id: true },
    }),
    prisma.users.findMany({
      where: { email: { endsWith: E2E_REGISTER_EMAIL_DOMAIN } },
      select: { tenantId: true },
    }),
  ]);

  const tenantIds = [
    ...new Set([
      ...systemTenants.map((tenant) => tenant.id),
      ...registerTestUsers.map((user) => user.tenantId),
    ]),
  ];

  if (tenantIds.length === 0) {
    return;
  }

  const tenantFilter = { tenantId: { in: tenantIds } };

  await prisma.asaas_webhook_events.deleteMany({ where: tenantFilter });
  await prisma.billing_payments.deleteMany({ where: tenantFilter });
  await prisma.tenant_subscriptions.deleteMany({ where: tenantFilter });
  await prisma.tenant_billing_accounts.deleteMany({ where: tenantFilter });
  await prisma.project_files.deleteMany({ where: tenantFilter });
  await prisma.budget_files.deleteMany({ where: tenantFilter });
  await prisma.email_templates.deleteMany({ where: tenantFilter });
  await prisma.tenant_fiscal_info.deleteMany({ where: tenantFilter });
  await prisma.cashFlow.deleteMany({ where: tenantFilter });
  await prisma.installmentPlanItem.deleteMany({ where: tenantFilter });
  await prisma.installmentPlan.deleteMany({ where: tenantFilter });
  await prisma.fixedExpense.deleteMany({ where: tenantFilter });
  await prisma.fixedIncome.deleteMany({ where: tenantFilter });
  await prisma.project.deleteMany({ where: tenantFilter });
  await prisma.budget.deleteMany({ where: tenantFilter });
  await prisma.employee.deleteMany({ where: tenantFilter });
  await prisma.client.deleteMany({ where: tenantFilter });
  await prisma.emailLog.deleteMany({ where: tenantFilter });
  await prisma.users.deleteMany({ where: tenantFilter });
  await prisma.tenants.deleteMany({ where: { id: { in: tenantIds } } });
}