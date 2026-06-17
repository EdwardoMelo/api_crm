import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CreateProjectDTORequest } from '../dto/request/CreateProjectDTORequest';
import { UpdateProjectDTORequest } from '../dto/request/UpdateProjectDTORequest';
import { ProjectDTOResponse } from '../dto/response/ProjectDTOResponse';
import { ProjectRepository } from '../repository/ProjectRepository';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly projectRepository: ProjectRepository) {}

  async create(dto: CreateProjectDTORequest): Promise<ProjectDTOResponse> {
    try {
      const data: Omit<Prisma.ProjectCreateInput, 'tenants'> = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        valorTotal: dto.valorTotal,
        status: dto.status,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFimPrevista: dto.dataFimPrevista ? new Date(dto.dataFimPrevista) : undefined,
        cliente: { connect: { id: dto.clienteId } },
        budget: dto.budgetId ? { connect: { id: dto.budgetId } } : undefined,
      };
      const project = await this.projectRepository.create(data);
      return ProjectDTOResponse.fromEntity(project);
    } catch (error) {
      this.logger.error('Erro ao criar projeto', (error as Error).stack);
      throw error;
    }
  }

  async findAll(): Promise<ProjectDTOResponse[]> {
    try {
      const projects = await this.projectRepository.findAll();
      return ProjectDTOResponse.fromEntities(projects);
    } catch (error) {
      this.logger.error('Erro ao listar projetos', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<ProjectDTOResponse> {
    const project = await this.getExistingProject(id);
    return ProjectDTOResponse.fromEntity(project);
  }

  async update(id: number, dto: UpdateProjectDTORequest): Promise<ProjectDTOResponse> {
    await this.getExistingProject(id);
    try {
      const data: Prisma.ProjectUpdateInput = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        valorTotal: dto.valorTotal,
        status: dto.status,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFimPrevista: dto.dataFimPrevista ? new Date(dto.dataFimPrevista) : undefined,
        cliente: dto.clienteId ? { connect: { id: dto.clienteId } } : undefined,
        budget: dto.budgetId ? { connect: { id: dto.budgetId } } : undefined,
      };
      const project = await this.projectRepository.update(id, data);
      return ProjectDTOResponse.fromEntity(project);
    } catch (error) {
      this.logger.error(`Erro ao atualizar projeto ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingProject(id);
    try {
      await this.projectRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir projeto ${id}`, (error as Error).stack);
      throw error;
    }
  }

  countActive(): Promise<number> {
    return this.projectRepository.countByStatus([
      ProjectStatus.PLANEJADO,
      ProjectStatus.EM_ANDAMENTO,
      ProjectStatus.PAUSADO,
    ]);
  }

  private async getExistingProject(id: number): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new EntityNotFoundException('Projeto', id);
    }
    return project;
  }
}
