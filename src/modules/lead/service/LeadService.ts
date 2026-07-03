import { Injectable, Logger } from '@nestjs/common';
import { Lead } from '@prisma/client';
import { LeadStatus } from '../../../common/enums';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { ClientDTOResponse } from '../../client/dto/response/ClientDTOResponse';
import { ClientService } from '../../client/service/ClientService';
import { ConvertLeadDTORequest } from '../dto/request/ConvertLeadDTORequest';
import { CreateLeadDTORequest } from '../dto/request/CreateLeadDTORequest';
import { ListLeadDTOQuery } from '../dto/request/ListLeadDTOQuery';
import { UpdateLeadDTORequest } from '../dto/request/UpdateLeadDTORequest';
import { LeadDTOResponse } from '../dto/response/LeadDTOResponse';
import { LeadRepository } from '../repository/LeadRepository';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly clientService: ClientService,
  ) {}

  async create(dto: CreateLeadDTORequest): Promise<LeadDTOResponse> {
    try {
      const lead = await this.leadRepository.create({
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa: dto.empresa,
        origem: dto.origem,
        observacoes: dto.observacoes,
        status: dto.status,
      });
      return LeadDTOResponse.fromEntity(lead);
    } catch (error) {
      this.logger.error('Erro ao criar lead', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListLeadDTOQuery): Promise<LeadDTOResponse[]> {
    try {
      const leads = await this.leadRepository.findAll(query);
      return LeadDTOResponse.fromEntities(leads);
    } catch (error) {
      this.logger.error('Erro ao listar leads', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<LeadDTOResponse> {
    const lead = await this.getExistingLead(id);
    return LeadDTOResponse.fromEntity(lead);
  }

  async update(id: number, dto: UpdateLeadDTORequest): Promise<LeadDTOResponse> {
    await this.getExistingLead(id);
    try {
      const lead = await this.leadRepository.update(id, {
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa: dto.empresa,
        origem: dto.origem,
        observacoes: dto.observacoes,
        status: dto.status,
      });
      return LeadDTOResponse.fromEntity(lead);
    } catch (error) {
      this.logger.error(`Erro ao atualizar lead ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingLead(id);
    try {
      await this.leadRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir lead ${id}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Promove um Lead a Cliente: cria o cliente com dados mais densos,
   * marca o lead como CONVERTIDO e guarda o vínculo com o cliente criado.
   */
  async convertToClient(id: number, dto: ConvertLeadDTORequest): Promise<ClientDTOResponse> {
    const lead = await this.getExistingLead(id);

    if (lead.status === LeadStatus.CONVERTIDO || lead.convertedClientId) {
      throw new BusinessRuleException('Este lead já foi convertido em cliente.');
    }

    try {
      const client = await this.clientService.create({
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa: dto.empresa,
        documento: dto.documento,
        observacoes: dto.observacoes,
      });

      await this.leadRepository.update(id, {
        status: LeadStatus.CONVERTIDO,
        convertedClient: { connect: { id: client.id } },
      });

      return client;
    } catch (error) {
      this.logger.error(`Erro ao converter lead ${id} em cliente`, (error as Error).stack);
      throw error;
    }
  }

  private async getExistingLead(id: number): Promise<Lead> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new EntityNotFoundException('Lead', id);
    }
    return lead;
  }
}
