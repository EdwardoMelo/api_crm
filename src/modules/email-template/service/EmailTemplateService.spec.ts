import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundException } from '../../../common/exceptions';
import { EmailTemplateRepository } from '../repository/EmailTemplateRepository';
import { EmailTemplateService } from './EmailTemplateService';

const entity = {
  id: 1,
  nome: 'Padrao',
  assunto: 'Assunto {{cliente.nome}}',
  corpo: 'Olá {{cliente.nome}}',
  variaveis: JSON.stringify(['cliente.nome']),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let repo: jest.Mocked<EmailTemplateRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        {
          provide: EmailTemplateRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EmailTemplateService);
    repo = module.get(EmailTemplateRepository);
  });

  it('findAll mapeia entidades', async () => {
    repo.findAll.mockResolvedValue([entity] as never);
    const result = await service.findAll();
    expect(result[0].variaveis).toEqual(['cliente.nome']);
  });

  it('findById retorna e lanca', async () => {
    repo.findById.mockResolvedValue(entity as never);
    expect((await service.findById(1)).id).toBe(1);

    repo.findById.mockResolvedValue(null);
    await expect(service.findById(9)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  describe('create', () => {
    it('cria template', async () => {
      repo.create.mockResolvedValue(entity as never);
      const result = await service.create({ nome: 'x', assunto: 'a', corpo: 'c' } as never);
      expect(result.id).toBe(1);
    });

    it('propaga erro', async () => {
      repo.create.mockRejectedValue(new Error('db'));
      await expect(service.create({} as never)).rejects.toThrow('db');
    });
  });

  describe('update', () => {
    it('atualiza template existente', async () => {
      repo.findById.mockResolvedValue(entity as never);
      repo.update.mockResolvedValue(entity as never);
      const result = await service.update(1, { nome: 'novo' } as never);
      expect(result.id).toBe(1);
    });

    it('propaga erro', async () => {
      repo.findById.mockResolvedValue(entity as never);
      repo.update.mockRejectedValue(new Error('db'));
      await expect(service.update(1, {} as never)).rejects.toThrow('db');
    });
  });

  it('remove valida existencia e deleta', async () => {
    repo.findById.mockResolvedValue(entity as never);
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });

  it('resolveTemplateText resolve assunto e corpo', () => {
    const context = {
      cliente: { nome: 'Ana', email: '', telefone: null, empresa: null, documento: null },
      empresa: {},
      orcamento: {},
      usuario: {},
    } as never;
    const result = service.resolveTemplateText('Oi {{cliente.nome}}', 'Corpo {{cliente.nome}}', context);
    expect(result.assunto).toContain('Ana');
  });

  it('previewFromBody detecta variaveis', () => {
    const context = {
      cliente: { nome: 'Ana', email: '', telefone: null, empresa: null, documento: null },
      empresa: {},
      orcamento: {},
      usuario: {},
    } as never;
    const result = service.previewFromBody(
      { assunto: 'Oi Ana', corpo: 'Corpo' } as never,
      context,
    );
    expect(result.assunto).toContain('{{cliente.nome}}');
  });
});
