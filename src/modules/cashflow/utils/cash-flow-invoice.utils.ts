import { randomUUID } from 'crypto';
import { BusinessRuleException } from '../../../common/exceptions';
import { sanitizeFileName } from '../../project/utils/project-file.utils';

export const MAX_CASH_FLOW_INVOICE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CASH_FLOW_INVOICE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function buildCashFlowInvoiceStoragePath(
  tenantId: number,
  cashFlowId: number,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  return `tenants/${tenantId}/cashflow/${cashFlowId}/${randomUUID()}-${safeName}`;
}

export function validateCashFlowInvoiceFile(
  file: Express.Multer.File | undefined,
): asserts file is Express.Multer.File {
  if (!file || !file.buffer?.length) {
    throw new BusinessRuleException('Arquivo não enviado ou vazio.');
  }

  if (file.size > MAX_CASH_FLOW_INVOICE_SIZE_BYTES) {
    throw new BusinessRuleException('Arquivo excede o tamanho máximo de 10 MB.');
  }

  if (!ALLOWED_CASH_FLOW_INVOICE_MIME_TYPES.has(file.mimetype)) {
    throw new BusinessRuleException('Tipo de arquivo não permitido. Use PDF ou imagem (JPEG, PNG, WebP).');
  }
}
