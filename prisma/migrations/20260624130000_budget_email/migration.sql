-- Migration: arquivos de orçamento, templates de e-mail e extensão de email_logs
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

CREATE TABLE `budget_files` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `tenantId`    INT NOT NULL,
  `budgetId`    INT NOT NULL,
  `fileName`    VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(512) NOT NULL,
  `mimeType`    VARCHAR(127) NOT NULL,
  `sizeBytes`   INT NOT NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy`   VARCHAR(20) NOT NULL DEFAULT 'system',
  `updatedBy`   VARCHAR(20) NOT NULL DEFAULT 'system',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `budget_files_budgetId_key` (`budgetId`),
  INDEX `budget_files_tenantId_budgetId_idx` (`tenantId`, `budgetId`),
  CONSTRAINT `budget_files_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `budget_files_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `budget_email_templates` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `tenantId`  INT NOT NULL,
  `nome`      VARCHAR(255) NOT NULL,
  `assunto`   VARCHAR(255) NOT NULL,
  `corpo`     TEXT NOT NULL,
  `variaveis` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `budget_email_templates_tenantId_nome_key` (`tenantId`, `nome`),
  CONSTRAINT `budget_email_templates_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE `email_logs`
  ADD COLUMN `budgetId` INT NULL,
  ADD COLUMN `templateId` INT NULL,
  ADD COLUMN `modoAnexo` ENUM('ANEXO', 'LINK') NULL,
  ADD CONSTRAINT `email_logs_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `email_logs_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `budget_email_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
