import { Test, TestingModule } from '@nestjs/testing';
import { Lead, LeadStatus } from '@prisma/client';
import { ClientService } from '../client/service/ClientService';
import { LeadController } from './controller/LeadController';
import { LeadRepository } from './repository/LeadRepository';
import { LeadService } from './service/LeadService';

// Teste de integração: Controller + Service reais, Repository e ClientService mockados.
const buildLead = (overrides: Partial<Lead> = {}): Lead =>
  ({
    id: 1,
    tenantId: 1,
    nome: 'Maria Lead',
    email: 'maria@lead.com',
    telefone: null,
    empresa: null,
    origem: null,
    observacoes: null,
    status: LeadStatus.NOVO,
    convertedClientId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    ...overrides,
  }) as Lead;

describe('LeadController (integração)', () => {
  let controller: LeadController;
  let repository: jest.Mocked<LeadRepository>;
  let clientService: jest.Mocked<ClientService>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<LeadRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const clientServiceMock: Partial<jest.Mocked<ClientService>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [
        LeadService,
        { provide: LeadRepository, useValue: repositoryMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
    }).compile();

    controller = module.get(LeadController);
    repository = module.get(LeadRepository);
    clientService = module.get(ClientService);
  });

  it('POST /leads cria e retorna DTO', async () => {
    repository.create.mockResolvedValue(buildLead());
    const result = await controller.create({ nome: 'Maria Lead' });
    expect(result.id).toBe(1);
  });

  it('GET /leads lista', async () => {
    repository.findAll.mockResolvedValue([buildLead()]);
    const result = await controller.findAll({});
    expect(result).toHaveLength(1);
  });

  it('GET /leads/:id retorna o lead', async () => {
    repository.findById.mockResolvedValue(buildLead());
    const result = await controller.findById(1);
    expect(result.nome).toBe('Maria Lead');
  });

  it('POST /leads/:id/convert converte em cliente', async () => {
    repository.findById.mockResolvedValue(buildLead());
    clientService.create.mockResolvedValue({ id: 77, nome: 'Maria Lead' } as never);
    repository.update.mockResolvedValue(
      buildLead({ status: LeadStatus.CONVERTIDO, convertedClientId: 77 }),
    );

    const result = await controller.convertToClient(1, {
      nome: 'Maria Lead',
      email: 'maria@lead.com',
    });

    expect(result.id).toBe(77);
  });
});
