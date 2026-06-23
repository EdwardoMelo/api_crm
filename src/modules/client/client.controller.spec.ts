import { Test, TestingModule } from '@nestjs/testing';
import { Client } from '@prisma/client';
import { ClientController } from './controller/ClientController';
import { ClientRepository } from './repository/ClientRepository';
import { ClientService } from './service/ClientService';
import { ClientWithMetrics } from './types/client-with-metrics.type';

// Teste de integração: Controller + Service reais, Repository mockado.
const buildClient = (overrides: Partial<Client> = {}): ClientWithMetrics => ({
  id: 1,
  tenantId: 1,
  nome: 'João Silva',
  email: 'joao@acme.com',
  telefone: null,
  empresa: null,
  documento: null,
  observacoes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdBy: '1',
  updatedBy: '1',
  valorOrcado: 0,
  valorVendido: 0,
  ...overrides,
});

describe('ClientController (integração)', () => {
  let controller: ClientController;
  let repository: jest.Mocked<ClientRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<ClientRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [ClientService, { provide: ClientRepository, useValue: repositoryMock }],
    }).compile();

    controller = module.get(ClientController);
    repository = module.get(ClientRepository);
  });

  it('POST /clients cria e retorna DTO', async () => {
    repository.create.mockResolvedValue(buildClient());
    const result = await controller.create({ nome: 'João Silva', email: 'joao@acme.com' });
    expect(result.id).toBe(1);
  });

  it('GET /clients lista', async () => {
    repository.findAll.mockResolvedValue([buildClient()]);
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });

  it('GET /clients/:id retorna o cliente', async () => {
    repository.findById.mockResolvedValue(buildClient());
    const result = await controller.findById(1);
    expect(result.nome).toBe('João Silva');
  });
});
