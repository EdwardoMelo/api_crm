import { Injectable, Logger } from '@nestjs/common';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CreateClientDTORequest } from '../dto/request/CreateClientDTORequest';
import { UpdateClientDTORequest } from '../dto/request/UpdateClientDTORequest';
import { ClientDTOResponse } from '../dto/response/ClientDTOResponse';
import { ClientRepository } from '../repository/ClientRepository';
import { ClientWithMetrics } from '../types/client-with-metrics.type';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(private readonly clientRepository: ClientRepository) {}

  async create(dto: CreateClientDTORequest): Promise<ClientDTOResponse> {
    try {
      const client = await this.clientRepository.create({
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa: dto.empresa,
        documento: dto.documento,
        observacoes: dto.observacoes,
      });
      return ClientDTOResponse.fromEntity(client);
    } catch (error) {
      this.logger.error('Erro ao criar cliente', (error as Error).stack);
      throw error;
    }
  }

  async findAll(): Promise<ClientDTOResponse[]> {
    try {
      const clients = await this.clientRepository.findAll();
      return ClientDTOResponse.fromEntities(clients);
    } catch (error) {
      this.logger.error('Erro ao listar clientes', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<ClientDTOResponse> {
    const client = await this.getExistingClient(id);
    return ClientDTOResponse.fromEntityWithMetrics(client);
  }

  async update(id: number, dto: UpdateClientDTORequest): Promise<ClientDTOResponse> {
    await this.getExistingClient(id);
    try {
      await this.clientRepository.update(id, {
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa: dto.empresa,
        documento: dto.documento,
        observacoes: dto.observacoes,
      });
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Erro ao atualizar cliente ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingClient(id);
    try {
      await this.clientRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir cliente ${id}`, (error as Error).stack);
      throw error;
    }
  }

  private async getExistingClient(id: number): Promise<ClientWithMetrics> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new EntityNotFoundException('Cliente', id);
    }
    return client;
  }
}
