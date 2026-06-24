import { randomUUID } from 'crypto';
import { BusinessRuleException } from '../../../common/exceptions';

export const MAX_BUDGET_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_BUDGET_FILE_MIME_TYPES = new Set(['application/pdf']);

export const BUDGET_FILE_SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function sanitizeBudgetFileName(fileName: string): string {
  const base = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 200) || 'orcamento.pdf';
}

export function buildBudgetStoragePath(
  tenantId: number,
  budgetId: number,
  fileName: string,
): string {
  const safeName = sanitizeBudgetFileName(fileName);
  return `tenants/${tenantId}/budgets/${budgetId}/${randomUUID()}-${safeName}`;
}

export function validateBudgetFile(
  file: Express.Multer.File | undefined,
): asserts file is Express.Multer.File {
  if (!file || !file.buffer?.length) {
    throw new BusinessRuleException('Arquivo não enviado ou vazio.');
  }

  if (file.size > MAX_BUDGET_FILE_SIZE_BYTES) {
    throw new BusinessRuleException('Arquivo excede o tamanho máximo de 10 MB.');
  }

  if (!ALLOWED_BUDGET_FILE_MIME_TYPES.has(file.mimetype)) {
    throw new BusinessRuleException('Apenas arquivos PDF são permitidos.');
  }
}
