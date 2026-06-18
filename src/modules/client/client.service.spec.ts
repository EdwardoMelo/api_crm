import { Test, TestingModule } from '@nestjs/testing';
import { Client } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { ClientService } from './service/ClientService';
import { ClientRepository } from './repository/ClientRepository';
import { ClientWithMetrics } from './types/client-with-metrics.type';

const buildClient = (overrides: Partial<Client> = {}): ClientWithMetrics => ({
  id: 1,
  tenantId: 1,
  nome: 'João Silva',
  email: 'joao@acme.com',
  telefone: '11999999999',
  empresa: 'ACME',
  documento: '123',
  observacoes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  valorOrcado: 0,
  valorVendido: 0,
  ...overrides,
});

describe('ClientService', () => {
  let service: ClientService;
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
      providers: [ClientService, { provide: ClientRepository, useValue: repositoryMock }],
    }).compile();

    service = module.get(ClientService);
    repository = module.get(ClientRepository);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria o cliente e retorna o DTO de response', async () => {
      const entity = buildClient();
      repository.create.mockResolvedValue(entity);

      const result = await service.create({ nome: 'João Silva', email: 'joao@acme.com' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'João Silva', email: 'joao@acme.com' }),
      );
      expect(result.id).toBe(1);
    });
  });

  describe('findById', () => {
    it('retorna o cliente quando existe', async () => {
      repository.findById.mockResolvedValue(buildClient());
      const result = await service.findById(1);
      expect(result.email).toBe('joao@acme.com');
    });

    it('lança EntityNotFoundException quando não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toBeInstanceOf(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza quando o cliente existe', async () => {
      repository.findById
        .mockResolvedValueOnce(buildClient())
        .mockResolvedValueOnce(buildClient({ nome: 'Novo Nome' }));
      repository.update.mockResolvedValue(buildClient({ nome: 'Novo Nome' }));

      const result = await service.update(1, { nome: 'Novo Nome' });

      expect(result.nome).toBe('Novo Nome');
    });

    it('falha quando o cliente não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update(999, { nome: 'x' })).rejects.toBeInstanceOf(
        EntityNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove quando existe', async () => {
      repository.findById.mockResolvedValue(buildClient());
      repository.delete.mockResolvedValue(buildClient());
      await service.remove(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('falha quando não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toBeInstanceOf(EntityNotFoundException);
    });
  });
});
