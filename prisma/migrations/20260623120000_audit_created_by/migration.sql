-- Migration: auditoria createdBy / updatedBy
-- Valores: 'system' (seed/e2e) ou id do usuário como string.
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `project_files`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `project_files_createdBy_idx` (`createdBy`);

ALTER TABLE `tenant_fiscal_info`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `tenant_fiscal_info_createdBy_idx` (`createdBy`);

ALTER TABLE `cash_flows`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `cash_flows_createdBy_idx` (`createdBy`);

ALTER TABLE `projects`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `projects_createdBy_idx` (`createdBy`);

ALTER TABLE `budgets`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `budgets_createdBy_idx` (`createdBy`);

ALTER TABLE `employees`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `employees_createdBy_idx` (`createdBy`);

ALTER TABLE `clients`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `clients_createdBy_idx` (`createdBy`);

ALTER TABLE `email_logs`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `email_logs_createdBy_idx` (`createdBy`);

ALTER TABLE `users`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `users_createdBy_idx` (`createdBy`);

ALTER TABLE `tenants`
  ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD INDEX `tenants_createdBy_idx` (`createdBy`);
