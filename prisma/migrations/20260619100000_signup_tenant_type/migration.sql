-- Migration: tipo de conta no tenant + e-mail de login único global
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `tenants`
  ADD COLUMN `tipo` ENUM('PESSOA_FISICA', 'EMPRESA') NOT NULL DEFAULT 'EMPRESA';

ALTER TABLE `users` DROP INDEX `users_tenantId_email_key`;
ALTER TABLE `users` ADD UNIQUE INDEX `users_email_key` (`email`);
