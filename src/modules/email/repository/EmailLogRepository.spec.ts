import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailLogRepository } from './EmailLogRepository';

describe('EmailLogRepository', () => {
  let repository: EmailLogRepository;
  let prisma: { emailLog: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      emailLog: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailLogRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    repository = module.get(EmailLogRepository);
  });

  it('create conecta o tenant', async () => {
    await repository.create({ destinatario: 'a@a.com' } as never);
    expect(prisma.emailLog.create).toHaveBeenCalled();
  });

  it('findAll filtra por tenant', async () => {
    await repository.findAll();
    expect(prisma.emailLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: 1 },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findById filtra por id e tenant', async () => {
    await repository.findById(5);
    expect(prisma.emailLog.findFirst).toHaveBeenCalledWith({
      where: { id: 5, tenantId: 1 },
    });
  });
});
