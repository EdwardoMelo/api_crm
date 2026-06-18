import { Injectable } from '@nestjs/common';
import { Prisma, tenant_fiscal_info } from '@prisma/client';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TenantFiscalRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  findByTenantId(): Promise<tenant_fiscal_info | null> {
    return this.prisma.tenant_fiscal_info.findUnique({
      where: { tenantId: this.tenantContext.getTenantId() },
    });
  }

  upsert(
    data: Omit<Prisma.tenant_fiscal_infoUncheckedCreateInput, 'tenantId'>,
  ): Promise<tenant_fiscal_info> {
    const tenantId = this.tenantContext.getTenantId();
    return this.prisma.tenant_fiscal_info.upsert({
      where: { tenantId },
      create: { ...data, tenantId },
      update: data,
    });
  }
}
