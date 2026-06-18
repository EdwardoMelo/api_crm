import { randomUUID } from 'crypto';
import { BusinessRuleException } from '../../../common/exceptions';

export const MAX_PROJECT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_PROJECT_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 200) || 'arquivo';
}

export function buildStoragePath(
  tenantId: number,
  projectId: number,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  return `tenants/${tenantId}/projects/${projectId}/${randomUUID()}-${safeName}`;
}

export function validateProjectFile(
  file: Express.Multer.File | undefined,
): asserts file is Express.Multer.File {
  if (!file || !file.buffer?.length) {
    throw new BusinessRuleException('Arquivo não enviado ou vazio.');
  }

  if (file.size > MAX_PROJECT_FILE_SIZE_BYTES) {
    throw new BusinessRuleException('Arquivo excede o tamanho máximo de 10 MB.');
  }

  if (!ALLOWED_PROJECT_FILE_MIME_TYPES.has(file.mimetype)) {
    throw new BusinessRuleException('Tipo de arquivo não permitido.');
  }
}
