-- Migration: anexo de nota fiscal em movimentações financeiras (Firebase Storage)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `cash_flows`
  ADD COLUMN `notaFiscalFileName` VARCHAR(255) NULL,
  ADD COLUMN `notaFiscalStoragePath` VARCHAR(512) NULL,
  ADD COLUMN `notaFiscalMimeType` VARCHAR(127) NULL,
  ADD COLUMN `notaFiscalSizeBytes` INT NULL;
