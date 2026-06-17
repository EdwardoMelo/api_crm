import { Injectable, Logger } from '@nestjs/common';
import { CashFlow, Prisma } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CreateCashFlowDTORequest } from '../dto/request/CreateCashFlowDTORequest';
import { UpdateCashFlowDTORequest } from '../dto/request/UpdateCashFlowDTORequest';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowRepository } from '../repository/CashFlowRepository';

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(private readonly cashFlowRepository: CashFlowRepository) {}

  async create(dto: CreateCashFlowDTORequest): Promise<CashFlowDTOResponse> {
    try {
      const data: Omit<Prisma.CashFlowCreateInput, 'tenants'> = {
        descricao: dto.descricao,
        valor: dto.valor,
        tipo: dto.tipo,
        status: dto.status,
        dataCompetencia: new Date(dto.dataCompetencia),
        dataPagamento: dto.dataPagamento ? new Date(dto.dataPagamento) : undefined,
        categoria: dto.categoria,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
        employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
      };
      const cashFlow = await this.cashFlowRepository.create(data);
      return CashFlowDTOResponse.fromEntity(cashFlow);
    } catch (error) {
      this.logger.error('Erro ao criar lançamento de fluxo de caixa', (error as Error).stack);
      throw error;
    }
  }

  async findAll(): Promise<CashFlowDTOResponse[]> {
    try {
      const cashFlows = await this.cashFlowRepository.findAll();
      return CashFlowDTOResponse.fromEntities(cashFlows);
    } catch (error) {
      this.logger.error('Erro ao listar fluxo de caixa', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<CashFlowDTOResponse> {
    const cashFlow = await this.getExistingCashFlow(id);
    return CashFlowDTOResponse.fromEntity(cashFlow);
  }

  async update(id: number, dto: UpdateCashFlowDTORequest): Promise<CashFlowDTOResponse> {
    await this.getExistingCashFlow(id);
    try {
      const data: Prisma.CashFlowUpdateInput = {
        descricao: dto.descricao,
        valor: dto.valor,
        tipo: dto.tipo,
        status: dto.status,
        dataCompetencia: dto.dataCompetencia ? new Date(dto.dataCompetencia) : undefined,
        dataPagamento: dto.dataPagamento ? new Date(dto.dataPagamento) : undefined,
        categoria: dto.categoria,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        client: dto.clientId ? { connect: { id: dto.clientId } } : undefined,
        employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
      };
      const cashFlow = await this.cashFlowRepository.update(id, data);
      return CashFlowDTOResponse.fromEntity(cashFlow);
    } catch (error) {
      this.logger.error(`Erro ao atualizar lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingCashFlow(id);
    try {
      await this.cashFlowRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir lançamento ${id}`, (error as Error).stack);
      throw error;
    }
  }

  private async getExistingCashFlow(id: number): Promise<CashFlow> {
    const cashFlow = await this.cashFlowRepository.findById(id);
    if (!cashFlow) {
      throw new EntityNotFoundException('Lançamento de fluxo de caixa', id);
    }
    return cashFlow;
  }
}
