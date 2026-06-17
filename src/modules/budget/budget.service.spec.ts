import { Test, TestingModule } from '@nestjs/testing';
import { Budget, BudgetStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../common/exceptions';
import { ProjectService } from '../project/service/ProjectService';
import { BudgetRepository } from './repository/BudgetRepository';
import { BudgetService } from './service/BudgetService';

const buildBudget = (overrides: Partial<Budget> = {}): Budget =>
  ({
    id: 1,
    clienteId: 10,
    titulo: 'Website',
    descricao: 'desc',
    valor: '15000' as never,
    status: BudgetStatus.APROVADO,
    dataValidade: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Budget;

describe('BudgetService', () => {
  let service: BudgetService;
  let repository: jest.Mocked<BudgetRepository>;
  let projectService: jest.Mocked<ProjectService>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BudgetRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const projectServiceMock: Partial<jest.Mocked<ProjectService>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: BudgetRepository, useValue: repositoryMock },
        { provide: ProjectService, useValue: projectServiceMock },
      ],
    }).compile();

    service = module.get(BudgetService);
    repository = module.get(BudgetRepository);
    projectService = module.get(ProjectService);
  });

  it('cria orçamento conectando o cliente', async () => {
    repository.create.mockResolvedValue(buildBudget());
    await service.create({ clienteId: 10, titulo: 'Website', valor: 15000 });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ cliente: { connect: { id: 10 } } }),
    );
  });

  describe('convertToProject', () => {
    it('cria projeto e marca orçamento como CONVERTIDO', async () => {
      repository.findById.mockResolvedValue(buildBudget());
      projectService.create.mockResolvedValue({ id: 20 } as never);
      repository.update.mockResolvedValue(buildBudget({ status: BudgetStatus.CONVERTIDO }));

      const result = await service.convertToProject(1);

      expect(projectService.create).toHaveBeenCalledWith(
        expect.objectContaining({ budgetId: 1, clienteId: 10, valorTotal: 15000 }),
      );
      expect(repository.update).toHaveBeenCalledWith(1, {
        status: BudgetStatus.CONVERTIDO,
      });
      expect(result.id).toBe(20);
    });

    it('falha se já estiver convertido', async () => {
      repository.findById.mockResolvedValue(buildBudget({ status: BudgetStatus.CONVERTIDO }));
      await expect(service.convertToProject(1)).rejects.toBeInstanceOf(BusinessRuleException);
      expect(projectService.create).not.toHaveBeenCalled();
    });

    it('falha se cancelado', async () => {
      repository.findById.mockResolvedValue(buildBudget({ status: BudgetStatus.CANCELADO }));
      await expect(service.convertToProject(1)).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('falha se orçamento não existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.convertToProject(999)).rejects.toBeInstanceOf(EntityNotFoundException);
    });
  });
});
