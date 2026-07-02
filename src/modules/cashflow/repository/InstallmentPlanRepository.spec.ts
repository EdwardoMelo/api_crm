import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { InstallmentPlanRepository } from './InstallmentPlanRepository';

describe('InstallmentPlanRepository', () => {
  let repository: InstallmentPlanRepository;
  let prisma: {
    installmentPlan: Record<string, jest.Mock>;
    installmentPlanItem: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      installmentPlan: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1, items: [] }),
        update: jest.fn().mockResolvedValue({ id: 1 }),
      },
      installmentPlanItem: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        update: jest.fn().mockResolvedValue({ id: 10 }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentPlanRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    repository = module.get(InstallmentPlanRepository);
  });

  it('createWithItems cria plano e itens numa transacao', async () => {
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) => cb(prisma));

    const result = await repository.createWithItems({ description: 'p' } as never, [
      { installmentNumber: 1, amount: 100, dueDate: new Date(), status: 'PENDENTE' } as never,
    ]);

    expect(prisma.installmentPlan.create).toHaveBeenCalled();
    expect(prisma.installmentPlanItem.createMany).toHaveBeenCalled();
    expect(prisma.installmentPlan.findUniqueOrThrow).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('findAll / findById / update / updateItem / findItemById delegam para prisma', async () => {
    await repository.findAll();
    expect(prisma.installmentPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 1 } }),
    );

    await repository.findById(1);
    expect(prisma.installmentPlan.findFirst).toHaveBeenCalled();

    await repository.update(1, { status: 'CANCELLED' } as never);
    expect(prisma.installmentPlan.update).toHaveBeenCalled();

    await repository.updateItem(10, { status: 'CANCELADO' } as never);
    expect(prisma.installmentPlanItem.update).toHaveBeenCalled();

    await repository.findItemById(10);
    expect(prisma.installmentPlanItem.findFirst).toHaveBeenCalledWith({
      where: { id: 10, tenantId: 1 },
    });
  });
});
