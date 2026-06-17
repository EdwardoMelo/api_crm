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
});
