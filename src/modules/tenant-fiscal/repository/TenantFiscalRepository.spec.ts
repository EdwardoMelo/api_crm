import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { TenantFiscalRepository } from './TenantFiscalRepository';

describe('TenantFiscalRepository', () => {
  let repository: TenantFiscalRepository;
  let prisma: { tenant_fiscal_info: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      tenant_fiscal_info: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantFiscalRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    repository = module.get(TenantFiscalRepository);
  });

  it('findByTenantId filtra por tenant', async () => {
    await repository.findByTenantId();
    expect(prisma.tenant_fiscal_info.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 1 },
    });
  });

  it('upsert cria/atualiza com auditoria', async () => {
    await repository.upsert({ razaoSocial: 'RS' } as never);
    expect(prisma.tenant_fiscal_info.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 1 } }),
    );
  });
});
