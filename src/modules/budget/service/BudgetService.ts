import { Injectable, Logger } from '@nestjs/common';
import { BudgetStatus, Prisma, ProjectStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { ProjectDTOResponse } from '../../project/dto/response/ProjectDTOResponse';
import { ProjectService } from '../../project/service/ProjectService';
import { CreateBudgetDTORequest } from '../dto/request/CreateBudgetDTORequest';
import { ListBudgetDTOQuery } from '../dto/request/ListBudgetDTOQuery';
import { UpdateBudgetDTORequest } from '../dto/request/UpdateBudgetDTORequest';
import { BudgetDTOResponse } from '../dto/response/BudgetDTOResponse';
import { BudgetRepository } from '../repository/BudgetRepository';
import { BudgetWithLead } from '../types/budget-with-lead.type';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly projectService: ProjectService,
  ) {}

  async create(dto: CreateBudgetDTORequest): Promise<BudgetDTOResponse> {
    try {
      const data: Omit<Prisma.BudgetCreateInput, 'tenants'> = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        valor: dto.valor,
        status: dto.status,
        dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : undefined,
        cliente: dto.clienteId ? { connect: { id: dto.clienteId } } : undefined,
        lead: dto.leadId ? { connect: { id: dto.leadId } } : undefined,
      };
      const budget = await this.budgetRepository.create(data);
      return this.findById(budget.id);
    } catch (error) {
      this.logger.error('Erro ao criar orçamento', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListBudgetDTOQuery): Promise<BudgetDTOResponse[]> {
    try {
      const budgets = await this.budgetRepository.findAll(query);
      return BudgetDTOResponse.fromEntities(budgets);
    } catch (error) {
      this.logger.error('Erro ao listar orçamentos', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<BudgetDTOResponse> {
    const budget = await this.getExistingBudget(id);
    return BudgetDTOResponse.fromEntity(budget);
  }

  async update(id: number, dto: UpdateBudgetDTORequest): Promise<BudgetDTOResponse> {
    await this.getExistingBudget(id);
    try {
      const data: Prisma.BudgetUpdateInput = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        valor: dto.valor,
        status: dto.status,
        dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : undefined,
        cliente: dto.clienteId ? { connect: { id: dto.clienteId } } : undefined,
        lead: dto.leadId ? { connect: { id: dto.leadId } } : undefined,
      };
      await this.budgetRepository.update(id, data);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Erro ao atualizar orçamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingBudget(id);
    try {
      await this.budgetRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir orçamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Converte um orçamento em projeto.
   * Cria o projeto vinculado e marca o orçamento como CONVERTIDO.
   */
  async convertToProject(id: number): Promise<ProjectDTOResponse> {
    const budget = await this.getExistingBudget(id);

    if (budget.status === BudgetStatus.CONVERTIDO) {
      throw new BusinessRuleException('Este orçamento já foi convertido em projeto.');
    }
    if (budget.status === BudgetStatus.CANCELADO || budget.status === BudgetStatus.REPROVADO) {
      throw new BusinessRuleException(
        'Não é possível converter um orçamento cancelado ou reprovado.',
      );
    }
    if (!budget.clienteId) {
      throw new BusinessRuleException(
        'Este orçamento está vinculado a um lead. Converta o lead em cliente antes de gerar o projeto.',
      );
    }

    try {
      const project = await this.projectService.create({
        clienteId: budget.clienteId,
        budgetId: budget.id,
        titulo: budget.titulo,
        descricao: budget.descricao ?? undefined,
        valorTotal: Number(budget.valor),
        status: ProjectStatus.PLANEJADO,
      });

      await this.budgetRepository.update(id, { status: BudgetStatus.CONVERTIDO });

      return project;
    } catch (error) {
      this.logger.error(`Erro ao converter orçamento ${id} em projeto`, (error as Error).stack);
      throw error;
    }
  }

  private async getExistingBudget(id: number): Promise<BudgetWithLead> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new EntityNotFoundException('Orçamento', id);
    }
    return budget;
  }
}
