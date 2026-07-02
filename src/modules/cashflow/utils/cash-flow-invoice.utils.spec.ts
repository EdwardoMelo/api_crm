import { BusinessRuleException } from '../../../common/exceptions';
import {
  ALLOWED_CASH_FLOW_INVOICE_MIME_TYPES,
  buildCashFlowInvoiceStoragePath,
  validateCashFlowInvoiceFile,
} from './cash-flow-invoice.utils';

describe('cash-flow-invoice.utils (extra)', () => {
  const file = {
    originalname: 'nf.pdf',
    buffer: Buffer.from('x'),
    mimetype: 'application/pdf',
    size: 100,
  } as Express.Multer.File;

  it('buildCashFlowInvoiceStoragePath sanitiza nome', () => {
    const path = buildCashFlowInvoiceStoragePath(1, 2, '../evil.pdf');
    expect(path).toMatch(/^tenants\/1\/cashflow\/2\/[a-f0-9-]+-.*evil\.pdf$/);
  });

  it('validateCashFlowInvoiceFile rejeita vazio', () => {
    expect(() => validateCashFlowInvoiceFile(undefined)).toThrow(BusinessRuleException);
  });

  it('validateCashFlowInvoiceFile rejeita tamanho e mime', () => {
    expect(() =>
      validateCashFlowInvoiceFile({ ...file, size: 11 * 1024 * 1024 } as never),
    ).toThrow('10 MB');
    expect(() =>
      validateCashFlowInvoiceFile({ ...file, mimetype: 'text/plain' } as never),
    ).toThrow('não permitido');
  });

  it('ALLOWED_CASH_FLOW_INVOICE_MIME_TYPES contem pdf', () => {
    expect(ALLOWED_CASH_FLOW_INVOICE_MIME_TYPES.has('application/pdf')).toBe(true);
  });
});
