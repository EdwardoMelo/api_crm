-- Migration: adiciona tenantId (FK → tenants) em todas as tabelas de negócio
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

-- Garante um tenant padrão para backfill de registros existentes
INSERT INTO `tenants` (`nome`, `slug`, `ativo`, `updatedAt`)
SELECT 'Empresa Demo', 'empresa-demo', true, CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `tenants` LIMIT 1);

SET @default_tenant_id = (SELECT `id` FROM `tenants` ORDER BY `id` ASC LIMIT 1);

-- clients
ALTER TABLE `clients` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `clients` SET `tenantId` = @default_tenant_id;
ALTER TABLE `clients` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `clients_tenantId_idx` ON `clients`(`tenantId`);
ALTER TABLE `clients` ADD CONSTRAINT `clients_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- employees
ALTER TABLE `employees` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `employees` SET `tenantId` = @default_tenant_id;
ALTER TABLE `employees` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `employees_tenantId_idx` ON `employees`(`tenantId`);
ALTER TABLE `employees` ADD CONSTRAINT `employees_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- budgets
ALTER TABLE `budgets` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `budgets` SET `tenantId` = @default_tenant_id;
ALTER TABLE `budgets` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `budgets_tenantId_idx` ON `budgets`(`tenantId`);
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- projects
ALTER TABLE `projects` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `projects` SET `tenantId` = @default_tenant_id;
ALTER TABLE `projects` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `projects_tenantId_idx` ON `projects`(`tenantId`);
ALTER TABLE `projects` ADD CONSTRAINT `projects_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- cash_flows
ALTER TABLE `cash_flows` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `cash_flows` SET `tenantId` = @default_tenant_id;
ALTER TABLE `cash_flows` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `cash_flows_tenantId_idx` ON `cash_flows`(`tenantId`);
ALTER TABLE `cash_flows` ADD CONSTRAINT `cash_flows_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- email_logs
ALTER TABLE `email_logs` ADD COLUMN `tenantId` INTEGER NULL;
UPDATE `email_logs` SET `tenantId` = @default_tenant_id;
ALTER TABLE `email_logs` MODIFY `tenantId` INTEGER NOT NULL;
CREATE INDEX `email_logs_tenantId_idx` ON `email_logs`(`tenantId`);
ALTER TABLE `email_logs` ADD CONSTRAINT `email_logs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
