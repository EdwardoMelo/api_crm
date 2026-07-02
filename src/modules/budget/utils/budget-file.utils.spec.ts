import { BusinessRuleException } from '../../../common/exceptions';
import {
  buildBudgetStoragePath,
  MAX_BUDGET_FILE_SIZE_BYTES,
  sanitizeBudgetFileName,
  validateBudgetFile,
} from './budget-file.utils';

describe('budget-file.utils', () => {
  it('sanitizeBudgetFileName remove caracteres invalidos', () => {
    expect(sanitizeBudgetFileName('a/b:c*.pdf')).toBe('a_b_c_.pdf');
  });

  it('sanitizeBudgetFileName usa fallback quando vazio', () => {
    expect(sanitizeBudgetFileName('   ')).toBe('orcamento.pdf');
  });

  it('buildBudgetStoragePath monta caminho por tenant/budget', () => {
    const path = buildBudgetStoragePath(1, 2, 'file.pdf');
    expect(path).toMatch(/^tenants\/1\/budgets\/2\/.+-file\.pdf$/);
  });

  describe('validateBudgetFile', () => {
    const base = {
      buffer: Buffer.from('x'),
      mimetype: 'application/pdf',
      size: 100,
    } as Express.Multer.File;

    it('aceita PDF valido', () => {
      expect(() => validateBudgetFile(base)).not.toThrow();
    });

    it('rejeita arquivo ausente/vazio', () => {
      expect(() => validateBudgetFile(undefined)).toThrow(BusinessRuleException);
      expect(() => validateBudgetFile({ ...base, buffer: Buffer.alloc(0) })).toThrow(
        BusinessRuleException,
      );
    });

    it('rejeita arquivo acima do limite', () => {
      expect(() =>
        validateBudgetFile({ ...base, size: MAX_BUDGET_FILE_SIZE_BYTES + 1 }),
      ).toThrow(BusinessRuleException);
    });

    it('rejeita mimetype nao PDF', () => {
      expect(() => validateBudgetFile({ ...base, mimetype: 'image/png' })).toThrow(
        BusinessRuleException,
      );
    });
  });
});
