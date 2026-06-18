import { project_files } from '@prisma/client';

export class ProjectFileDTOResponse {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  downloadUrl: string;

  static fromEntity(entity: project_files, downloadUrl: string): ProjectFileDTOResponse {
    const dto = new ProjectFileDTOResponse();
    dto.id = entity.id;
    dto.fileName = entity.fileName;
    dto.mimeType = entity.mimeType;
    dto.sizeBytes = entity.sizeBytes;
    dto.createdAt = entity.createdAt;
    dto.downloadUrl = downloadUrl;
    return dto;
  }

  static async fromEntities(
    entities: project_files[],
    getSignedUrl: (storagePath: string) => Promise<string>,
  ): Promise<ProjectFileDTOResponse[]> {
    return Promise.all(
      entities.map(async (entity) =>
        ProjectFileDTOResponse.fromEntity(entity, await getSignedUrl(entity.storagePath)),
      ),
    );
  }
}
