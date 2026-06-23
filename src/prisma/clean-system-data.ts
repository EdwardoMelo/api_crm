import { PrismaClient } from '@prisma/client';
import { SYSTEM_ACTOR } from '../common/audit/audit.constants';

/**
 * Remove tenants criados pelo seed/e2e (createdBy = 'system') e todos os dados
 * vinculados a eles. Tenants e dados de usuários reais são preservados.
 */
export async function cleanSystemData(prisma: PrismaClient): Promise<void> {
  const systemTenants = await prisma.tenants.findMany({
    where: { createdBy: SYSTEM_ACTOR },
    select: { id: true },
  });
  const systemTenantIds = systemTenants.map((tenant) => tenant.id);

  if (systemTenantIds.length === 0) {
    return;
  }

  const tenantFilter = { tenantId: { in: systemTenantIds } };

  await prisma.project_files.deleteMany({ where: tenantFilter });
  await prisma.tenant_fiscal_info.deleteMany({ where: tenantFilter });
  await prisma.cashFlow.deleteMany({ where: tenantFilter });
  await prisma.project.deleteMany({ where: tenantFilter });
  await prisma.budget.deleteMany({ where: tenantFilter });
  await prisma.employee.deleteMany({ where: tenantFilter });
  await prisma.client.deleteMany({ where: tenantFilter });
  await prisma.emailLog.deleteMany({ where: tenantFilter });
  await prisma.users.deleteMany({ where: tenantFilter });
  await prisma.tenants.deleteMany({ where: { id: { in: systemTenantIds } } });
}
