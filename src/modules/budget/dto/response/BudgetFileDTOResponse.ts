import { budget_files } from '@prisma/client';

export class BudgetFileDTOResponse {
  id: number;
  budgetId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  createdAt: Date;

  static fromEntity(entity: budget_files, downloadUrl: string): BudgetFileDTOResponse {
    const dto = new BudgetFileDTOResponse();
    dto.id = entity.id;
    dto.budgetId = entity.budgetId;
    dto.fileName = entity.fileName;
    dto.mimeType = entity.mimeType;
    dto.sizeBytes = entity.sizeBytes;
    dto.downloadUrl = downloadUrl;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
