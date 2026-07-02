import { Test, TestingModule } from '@nestjs/testing';
import { Employee, TipoContratacao } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { EmployeeRepository } from './repository/EmployeeRepository';
import { EmployeeService } from './service/EmployeeService';

const buildEmployee = (overrides: Partial<Employee> = {}): Employee =>
  ({
    id: 1,
    nome: 'Carlos',
    email: 'carlos@empresa.com',
    telefone: null,
    cargo: 'Dev',
    tipoContratacao: TipoContratacao.CLT,
    salarioBase: null,
    ativo: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Employee;

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repository: jest.Mocked<EmployeeRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<EmployeeRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeService, { provide: EmployeeRepository, useValue: repositoryMock }],
    }).compile();

    service = module.get(EmployeeService);
    repository = module.get(EmployeeRepository);
  });

  it('cria funcionário com ativo true por padrão', async () => {
    repository.create.mockResolvedValue(buildEmployee());
    await service.create({
      nome: 'Carlos',
      email: 'carlos@empresa.com',
      tipoContratacao: TipoContratacao.CLT,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ ativo: true, tipoContratacao: TipoContratacao.CLT }),
    );
  });

  it('findById lança quando não existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById(999)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  it('converte salarioBase Decimal para number no response', async () => {
    repository.findById.mockResolvedValue(buildEmployee({ salarioBase: '8000' as never }));
    const result = await service.findById(1);
    expect(result.salarioBase).toBe(8000);
  });

  it('findAll retorna lista', async () => {
    repository.findAll.mockResolvedValue([buildEmployee()]);
    const result = await service.findAll({} as never);
    expect(result).toHaveLength(1);
  });

  it('findAll propaga erro', async () => {
    repository.findAll.mockRejectedValue(new Error('db'));
    await expect(service.findAll()).rejects.toThrow('db');
  });

  it('create propaga erro', async () => {
    repository.create.mockRejectedValue(new Error('db'));
    await expect(
      service.create({ nome: 'x', email: 'x@t.com', tipoContratacao: TipoContratacao.CLT }),
    ).rejects.toThrow('db');
  });

  it('update retorna funcionario atualizado', async () => {
    repository.findById.mockResolvedValue(buildEmployee());
    repository.update.mockResolvedValue(buildEmployee({ nome: 'Novo' }));
    const result = await service.update(1, { nome: 'Novo' });
    expect(result.nome).toBe('Novo');
  });

  it('update propaga erro', async () => {
    repository.findById.mockResolvedValue(buildEmployee());
    repository.update.mockRejectedValue(new Error('db'));
    await expect(service.update(1, { nome: 'Novo' })).rejects.toThrow('db');
  });

  it('remove exclui funcionario', async () => {
    repository.findById.mockResolvedValue(buildEmployee());
    await service.remove(1);
    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('remove propaga erro', async () => {
    repository.findById.mockResolvedValue(buildEmployee());
    repository.delete.mockRejectedValue(new Error('db'));
    await expect(service.remove(1)).rejects.toThrow('db');
  });
});
