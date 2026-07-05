import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import {
  FILE_STORAGE,
  FileStorageProvider,
} from '../../storage/storage.interface';
import { CreateProjectDTORequest } from '../dto/request/CreateProjectDTORequest';
import { ListProjectDTOQuery } from '../dto/request/ListProjectDTOQuery';
import { UpdateProjectDTORequest } from '../dto/request/UpdateProjectDTORequest';
import { ProjectDTOResponse } from '../dto/response/ProjectDTOResponse';
import { ProjectFileDTOResponse } from '../dto/response/ProjectFileDTOResponse';
import { ProjectFileRepository } from '../repository/ProjectFileRepository';
import { ProjectRepository } from '../repository/ProjectRepository';
import { buildStoragePath, validateProjectFile } from '../utils/project-file.utils';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorageProvider,
  ) {}

  async create(dto: CreateProjectDTORequest): Promise<ProjectDTOResponse> {
    try {
      const data: Omit<Prisma.ProjectCreateInput, 'tenants'> = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        valorTotal: dto.valorTotal,
        status: dto.status,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFimPrevista: dto.dataFimPrevista ? new Date(dto.dataFimPrevista) : undefined,
        cliente: dto.clienteId ? { connect: { id: dto.clienteId } } : undefined,
        budget: dto.budgetId ? { connect: { id: dto.budgetId } } : undefined,
      };
      const project = await this.projectRepository.create(data);
      return ProjectDTOResponse.fromEntity(project);
    } catch (error) {
      this.logger.error('Erro ao criar projeto', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListProjectDTOQuery): Promise<ProjectDTOResponse[]> {
    try {
      const projects = await this.projectRepository.findAll(query);
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
      const files = await this.projectFileRepository.findByProjectId(id);
      await Promise.all(
        files.map((file) =>
          this.fileStorage.delete(file.storagePath).catch((error) => {
            this.logger.warn(
              `Falha ao excluir ${file.storagePath} no storage: ${(error as Error).message}`,
            );
          }),
        ),
      );
      await this.projectRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir projeto ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async addFile(projectId: number, file: Express.Multer.File): Promise<ProjectFileDTOResponse> {
    const project = await this.getExistingProject(projectId);
    validateProjectFile(file);

    const tenantId = project.tenantId;
    const storagePath = buildStoragePath(tenantId, projectId, file.originalname);

    try {
      await this.fileStorage.upload(storagePath, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Erro ao enviar arquivo do projeto ${projectId}`, (error as Error).stack);
      throw error;
    }

    try {
      const entity = await this.projectFileRepository.create({
        tenantId,
        projectId,
        fileName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });
      const downloadUrl = await this.fileStorage.getSignedUrl(storagePath);
      return ProjectFileDTOResponse.fromEntity(entity, downloadUrl);
    } catch (error) {
      await this.fileStorage.delete(storagePath).catch(() => undefined);
      this.logger.error(`Erro ao registrar arquivo do projeto ${projectId}`, (error as Error).stack);
      throw error;
    }
  }

  async listFiles(projectId: number): Promise<ProjectFileDTOResponse[]> {
    await this.getExistingProject(projectId);
    const files = await this.projectFileRepository.findByProjectId(projectId);
    return ProjectFileDTOResponse.fromEntities(files, (path) =>
      this.fileStorage.getSignedUrl(path),
    );
  }

  async deleteFile(projectId: number, fileId: number): Promise<void> {
    await this.getExistingProject(projectId);
    const file = await this.projectFileRepository.findById(projectId, fileId);
    if (!file) {
      throw new EntityNotFoundException('Arquivo do projeto', fileId);
    }

    try {
      await this.fileStorage.delete(file.storagePath);
      await this.projectFileRepository.delete(fileId);
    } catch (error) {
      this.logger.error(
        `Erro ao excluir arquivo ${fileId} do projeto ${projectId}`,
        (error as Error).stack,
      );
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
