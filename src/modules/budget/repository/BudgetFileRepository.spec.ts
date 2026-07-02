import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { BudgetFileRepository } from './BudgetFileRepository';

describe('BudgetFileRepository', () => {
  let repository: BudgetFileRepository;
  let prisma: { budget_files: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      budget_files: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetFileRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    repository = module.get(BudgetFileRepository);
  });

  it('findByBudgetId filtra por tenant', async () => {
    await repository.findByBudgetId(5);
    expect(prisma.budget_files.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 1, budgetId: 5 },
    });
  });

  it('upsert cria/atualiza com auditoria', async () => {
    await repository.upsert(5, {
      tenantId: 1,
      fileName: 'a.pdf',
      storagePath: 'p',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    } as never);
    expect(prisma.budget_files.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { budgetId: 5 } }),
    );
  });

  it('deleteByBudgetId resolve para undefined', async () => {
    const result = await repository.deleteByBudgetId(5);
    expect(result).toBeUndefined();
    expect(prisma.budget_files.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 1, budgetId: 5 },
    });
  });
});
