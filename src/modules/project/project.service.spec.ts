import { Test, TestingModule } from '@nestjs/testing';
import { Project, ProjectStatus } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { ProjectRepository } from './repository/ProjectRepository';
import { ProjectService } from './service/ProjectService';

const buildProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: 1,
    clienteId: 10,
    budgetId: null,
    titulo: 'Projeto',
    descricao: null,
    valorTotal: '1000' as never,
    status: ProjectStatus.PLANEJADO,
    dataInicio: null,
    dataFimPrevista: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Project;

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: jest.Mocked<ProjectRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<ProjectRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService, { provide: ProjectRepository, useValue: repositoryMock }],
    }).compile();
    service = module.get(ProjectService);
    repository = module.get(ProjectRepository);
  });

  it('cria projeto conectando o cliente', async () => {
    repository.create.mockResolvedValue(buildProject());
    await service.create({ clienteId: 10, titulo: 'Projeto', valorTotal: 1000 });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ cliente: { connect: { id: 10 } } }),
    );
  });

  it('findById lança quando não existe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById(999)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  it('countActive consulta os status ativos', async () => {
    repository.countByStatus.mockResolvedValue(3);
    const result = await service.countActive();
    expect(result).toBe(3);
    expect(repository.countByStatus).toHaveBeenCalledWith([
      ProjectStatus.PLANEJADO,
      ProjectStatus.EM_ANDAMENTO,
      ProjectStatus.PAUSADO,
    ]);
  });
});
