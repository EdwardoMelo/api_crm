import { Test, TestingModule } from '@nestjs/testing';
import { Lead, LeadStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../common/exceptions';
import { ClientService } from '../client/service/ClientService';
import { LeadService } from './service/LeadService';
import { LeadRepository } from './repository/LeadRepository';

const buildLead = (overrides: Partial<Lead> = {}): Lead =>
  ({
    id: 1,
    tenantId: 1,
    nome: 'Maria Lead',
    email: 'maria@lead.com',
    telefone: '11988887777',
    empresa: 'Startup X',
    origem: 'Instagram',
    observacoes: null,
    status: LeadStatus.NOVO,
    convertedClientId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: '1',
    updatedBy: '1',
    ...overrides,
  }) as Lead;

describe('LeadService', () => {
  let service: LeadService;
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
      providers: [
        LeadService,
        { provide: LeadRepository, useValue: repositoryMock },
        { provide: ClientService, useValue: clientServiceMock },
      ],
    }).compile();

    service = module.get(LeadService);
    repository = module.get(LeadRepository);
    clientService = module.get(ClientService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria o lead e retorna o DTO', async () => {
      repository.create.mockResolvedValue(buildLead());
      const result = await service.create({ nome: 'Maria Lead' });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Maria Lead' }),
      );
      expect(result.id).toBe(1);
      expect(result.status).toBe(LeadStatus.NOVO);
    });

    it('propaga erro', async () => {
      repository.create.mockRejectedValue(new Error('db'));
      await expect(service.create({ nome: 'x' })).rejects.toThrow('db');
    });
  });

  describe('findById', () => {
    it('retorna o lead quando existe', async () => {
      repository.findById.mockResolvedValue(buildLead());
      const result = await service.findById(1);
      expect(result.email).toBe('maria@lead.com');
    });

    it('lança EntityNotFoundException quando não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toBeInstanceOf(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza quando o lead existe', async () => {
      repository.findById.mockResolvedValue(buildLead());
      repository.update.mockResolvedValue(buildLead({ status: LeadStatus.QUALIFICADO }));
      const result = await service.update(1, { status: LeadStatus.QUALIFICADO });
      expect(result.status).toBe(LeadStatus.QUALIFICADO);
    });

    it('falha quando o lead não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update(999, { nome: 'x' })).rejects.toBeInstanceOf(
        EntityNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove quando existe', async () => {
      repository.findById.mockResolvedValue(buildLead());
      repository.delete.mockResolvedValue(buildLead());
      await service.remove(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('falha quando não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toBeInstanceOf(EntityNotFoundException);
    });
  });

  describe('convertToClient', () => {
    it('cria o cliente, marca o lead como CONVERTIDO e guarda o vínculo', async () => {
      repository.findById.mockResolvedValue(buildLead());
      clientService.create.mockResolvedValue({ id: 50, nome: 'Maria Lead' } as never);
      repository.update.mockResolvedValue(
        buildLead({ status: LeadStatus.CONVERTIDO, convertedClientId: 50 }),
      );

      const result = await service.convertToClient(1, {
        nome: 'Maria Lead',
        email: 'maria@lead.com',
      });

      expect(clientService.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Maria Lead', email: 'maria@lead.com' }),
      );
      expect(repository.update).toHaveBeenCalledWith(1, {
        status: LeadStatus.CONVERTIDO,
        convertedClient: { connect: { id: 50 } },
      });
      expect(result.id).toBe(50);
    });

    it('falha se o lead já foi convertido', async () => {
      repository.findById.mockResolvedValue(buildLead({ status: LeadStatus.CONVERTIDO }));
      await expect(
        service.convertToClient(1, { nome: 'x', email: 'x@x.com' }),
      ).rejects.toBeInstanceOf(BusinessRuleException);
      expect(clientService.create).not.toHaveBeenCalled();
    });

    it('falha se já existe convertedClientId', async () => {
      repository.findById.mockResolvedValue(buildLead({ convertedClientId: 99 }));
      await expect(
        service.convertToClient(1, { nome: 'x', email: 'x@x.com' }),
      ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('falha se o lead não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.convertToClient(999, { nome: 'x', email: 'x@x.com' }),
      ).rejects.toBeInstanceOf(EntityNotFoundException);
    });

    it('propaga erro do ClientService', async () => {
      repository.findById.mockResolvedValue(buildLead());
      clientService.create.mockRejectedValue(new Error('db'));
      await expect(
        service.convertToClient(1, { nome: 'x', email: 'x@x.com' }),
      ).rejects.toThrow('db');
    });
  });

  it('findAll retorna lista', async () => {
    repository.findAll.mockResolvedValue([buildLead()]);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('findAll propaga erro', async () => {
    repository.findAll.mockRejectedValue(new Error('db'));
    await expect(service.findAll()).rejects.toThrow('db');
  });
});
