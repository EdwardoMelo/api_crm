import { Test, TestingModule } from '@nestjs/testing';
import { Project, ProjectStatus, project_files } from '@prisma/client';
import { FILE_STORAGE, FileStorageProvider } from '../storage/storage.interface';
import { ProjectController } from './controller/ProjectController';
import { ProjectFileRepository } from './repository/ProjectFileRepository';
import { ProjectRepository } from './repository/ProjectRepository';
import { ProjectService } from './service/ProjectService';

const buildProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: 1,
    tenantId: 1,
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
    createdBy: 'system',
    updatedBy: 'system',
    ...overrides,
  }) as Project;

const buildFile = (): project_files => ({
  id: 1,
  tenantId: 1,
  projectId: 1,
  fileName: 'doc.pdf',
  storagePath: 'tenants/1/projects/1/uuid-doc.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  createdAt: new Date('2026-01-01'),
  createdBy: '1',
  updatedBy: '1',
});

const buildMulterFile = (): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'doc.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('pdf'),
  }) as Express.Multer.File;

describe('ProjectController (integração)', () => {
  let controller: ProjectController;
  let repository: jest.Mocked<ProjectRepository>;
  let fileRepository: jest.Mocked<ProjectFileRepository>;
  let fileStorage: jest.Mocked<FileStorageProvider>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<ProjectRepository>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
    };
    const fileRepositoryMock: Partial<jest.Mocked<ProjectFileRepository>> = {
      create: jest.fn(),
      findByProjectId: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      deleteByProjectId: jest.fn(),
    };
    const fileStorageMock: jest.Mocked<FileStorageProvider> = {
      upload: jest.fn(),
      delete: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        { provide: ProjectRepository, useValue: repositoryMock },
        { provide: ProjectFileRepository, useValue: fileRepositoryMock },
        { provide: FILE_STORAGE, useValue: fileStorageMock },
      ],
    }).compile();

    controller = module.get(ProjectController);
    repository = module.get(ProjectRepository);
    fileRepository = module.get(ProjectFileRepository);
    fileStorage = module.get(FILE_STORAGE);
  });

  it('POST /projects/:id/files retorna arquivo criado', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileStorage.upload.mockResolvedValue(undefined);
    fileStorage.getSignedUrl.mockResolvedValue('https://signed.url');
    fileRepository.create.mockResolvedValue(buildFile());

    const result = await controller.addFile(1, buildMulterFile());

    expect(result.fileName).toBe('doc.pdf');
    expect(result.downloadUrl).toBe('https://signed.url');
  });

  it('GET /projects/:id/files lista arquivos', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findByProjectId.mockResolvedValue([buildFile()]);
    fileStorage.getSignedUrl.mockResolvedValue('https://signed.url');

    const result = await controller.listFiles(1);

    expect(result).toHaveLength(1);
  });

  it('DELETE /projects/:id/files/:fileId remove arquivo', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findById.mockResolvedValue(buildFile());
    fileStorage.delete.mockResolvedValue(undefined);
    fileRepository.delete.mockResolvedValue(buildFile());

    await expect(controller.deleteFile(1, 1)).resolves.toBeUndefined();
  });
});
