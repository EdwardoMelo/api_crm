import { Test, TestingModule } from '@nestjs/testing';
import { mockActorContextProvider } from '../../../common/audit/actor-context.mock';
import { mockTenantContextProvider } from '../../../common/tenant/tenant-context.mock';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailTemplateRepository } from './EmailTemplateRepository';

describe('EmailTemplateRepository', () => {
  let repository: EmailTemplateRepository;
  let prisma: { email_templates: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      email_templates: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({ id: 1 }),
        delete: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateRepository,
        { provide: PrismaService, useValue: prisma },
        mockTenantContextProvider,
        mockActorContextProvider,
      ],
    }).compile();

    repository = module.get(EmailTemplateRepository);
  });

  it('findAll filtra por tenant', async () => {
    await repository.findAll();
    expect(prisma.email_templates.findMany).toHaveBeenCalledWith({
      where: { tenantId: 1 },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('findById filtra por id e tenant', async () => {
    await repository.findById(2);
    expect(prisma.email_templates.findFirst).toHaveBeenCalledWith({
      where: { id: 2, tenantId: 1 },
    });
  });

  it('create serializa variaveis', async () => {
    await repository.create({ nome: 'n', assunto: 'a', corpo: 'c', variaveis: ['cliente.nome'] });
    const arg = prisma.email_templates.create.mock.calls[0][0];
    expect(arg.data.variaveis).toBe(JSON.stringify(['cliente.nome']));
  });

  it('update serializa variaveis quando presentes', async () => {
    await repository.update(1, { nome: 'n', variaveis: ['cliente.nome'] });
    const arg = prisma.email_templates.update.mock.calls[0][0];
    expect(arg.data.variaveis).toBe(JSON.stringify(['cliente.nome']));
  });

  it('update mantem variaveis undefined quando ausentes', async () => {
    await repository.update(1, { nome: 'n' });
    const arg = prisma.email_templates.update.mock.calls[0][0];
    expect(arg.data.variaveis).toBeUndefined();
  });

  it('delete delega para prisma', async () => {
    await repository.delete(1);
    expect(prisma.email_templates.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
