import { Test, TestingModule } from '@nestjs/testing';
import { Project, ProjectStatus, project_files } from '@prisma/client';
import { EntityNotFoundException } from '../../common/exceptions';
import { FILE_STORAGE, FileStorageProvider } from '../storage/storage.interface';
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

const buildFile = (overrides: Partial<project_files> = {}): project_files => ({
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
  ...overrides,
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

describe('ProjectService', () => {
  let service: ProjectService;
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
      download: jest.fn(),
      delete: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: ProjectRepository, useValue: repositoryMock },
        { provide: ProjectFileRepository, useValue: fileRepositoryMock },
        { provide: FILE_STORAGE, useValue: fileStorageMock },
      ],
    }).compile();
    service = module.get(ProjectService);
    repository = module.get(ProjectRepository);
    fileRepository = module.get(ProjectFileRepository);
    fileStorage = module.get(FILE_STORAGE);
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

  it('addFile envia ao storage e persiste metadados', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileStorage.upload.mockResolvedValue(undefined);
    fileStorage.getSignedUrl.mockResolvedValue('https://signed.url');
    fileRepository.create.mockResolvedValue(buildFile());

    const result = await service.addFile(1, buildMulterFile());

    expect(fileStorage.upload).toHaveBeenCalled();
    expect(fileRepository.create).toHaveBeenCalled();
    expect(result.downloadUrl).toBe('https://signed.url');
  });

  it('addFile faz rollback no storage se persistência falhar', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileStorage.upload.mockResolvedValue(undefined);
    fileStorage.delete.mockResolvedValue(undefined);
    fileRepository.create.mockRejectedValue(new Error('db error'));

    await expect(service.addFile(1, buildMulterFile())).rejects.toThrow('db error');
    expect(fileStorage.delete).toHaveBeenCalled();
  });

  it('listFiles retorna arquivos com URL assinada', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findByProjectId.mockResolvedValue([buildFile()]);
    fileStorage.getSignedUrl.mockResolvedValue('https://signed.url');

    const result = await service.listFiles(1);

    expect(result).toHaveLength(1);
    expect(result[0].downloadUrl).toBe('https://signed.url');
  });

  it('deleteFile remove storage e registro', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findById.mockResolvedValue(buildFile());
    fileStorage.delete.mockResolvedValue(undefined);
    fileRepository.delete.mockResolvedValue(buildFile());

    await service.deleteFile(1, 1);

    expect(fileStorage.delete).toHaveBeenCalledWith(buildFile().storagePath);
    expect(fileRepository.delete).toHaveBeenCalledWith(1);
  });

  it('remove exclui arquivos do storage antes do projeto', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findByProjectId.mockResolvedValue([buildFile()]);
    fileStorage.delete.mockResolvedValue(undefined);
    repository.delete.mockResolvedValue(buildProject());

    await service.remove(1);

    expect(fileStorage.delete).toHaveBeenCalled();
    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('findAll retorna lista', async () => {
    repository.findAll.mockResolvedValue([buildProject()]);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('findAll propaga erro', async () => {
    repository.findAll.mockRejectedValue(new Error('db'));
    await expect(service.findAll()).rejects.toThrow('db');
  });

  it('update retorna projeto atualizado', async () => {
    repository.findById.mockResolvedValue(buildProject());
    repository.update.mockResolvedValue(buildProject({ titulo: 'Novo' }));
    expect((await service.update(1, { titulo: 'Novo' })).titulo).toBe('Novo');
  });

  it('update propaga erro', async () => {
    repository.findById.mockResolvedValue(buildProject());
    repository.update.mockRejectedValue(new Error('db'));
    await expect(service.update(1, {})).rejects.toThrow('db');
  });

  it('create propaga erro', async () => {
    repository.create.mockRejectedValue(new Error('db'));
    await expect(service.create({ clienteId: 10, titulo: 'x', valorTotal: 1 })).rejects.toThrow(
      'db',
    );
  });

  it('addFile propaga erro de upload', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileStorage.upload.mockRejectedValue(new Error('storage'));
    await expect(service.addFile(1, buildMulterFile())).rejects.toThrow('storage');
  });

  it('deleteFile lança quando arquivo não existe', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findById.mockResolvedValue(null);
    await expect(service.deleteFile(1, 99)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  it('deleteFile propaga erro', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findById.mockResolvedValue(buildFile());
    fileStorage.delete.mockRejectedValue(new Error('storage'));
    await expect(service.deleteFile(1, 1)).rejects.toThrow('storage');
  });

  it('remove propaga erro', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findByProjectId.mockResolvedValue([]);
    repository.delete.mockRejectedValue(new Error('db'));
    await expect(service.remove(1)).rejects.toThrow('db');
  });

  it('remove continua se delete de arquivo falhar', async () => {
    repository.findById.mockResolvedValue(buildProject());
    fileRepository.findByProjectId.mockResolvedValue([buildFile()]);
    fileStorage.delete.mockRejectedValue(new Error('storage fail'));
    repository.delete.mockResolvedValue(buildProject());
    await service.remove(1);
    expect(repository.delete).toHaveBeenCalledWith(1);
  });
});
