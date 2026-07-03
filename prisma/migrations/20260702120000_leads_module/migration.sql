-- Migration: módulo de Leads + vínculos opcionais (orçamento<->lead, movimentação<->orçamento)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

-- 1. Tabela de leads
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(180) NOT NULL,
    `email` VARCHAR(180) NULL,
    `telefone` VARCHAR(40) NULL,
    `empresa` VARCHAR(180) NULL,
    `origem` VARCHAR(120) NULL,
    `observacoes` TEXT NULL,
    `status` ENUM('NOVO', 'EM_CONTATO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO') NOT NULL DEFAULT 'NOVO',
    `convertedClientId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    INDEX `leads_nome_idx`(`nome`),
    INDEX `leads_status_idx`(`status`),
    INDEX `leads_tenantId_idx`(`tenantId`),
    INDEX `leads_convertedClientId_idx`(`convertedClientId`),
    INDEX `leads_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `leads`
    ADD CONSTRAINT `leads_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `leads_convertedClientId_fkey` FOREIGN KEY (`convertedClientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Orçamento pode apontar para um Lead OU um Cliente (ambos opcionais)
ALTER TABLE `budgets`
    MODIFY `clienteId` INTEGER NULL,
    ADD COLUMN `leadId` INTEGER NULL;

ALTER TABLE `budgets`
    ADD INDEX `budgets_leadId_idx`(`leadId`);

ALTER TABLE `budgets`
    ADD CONSTRAINT `budgets_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Movimentação financeira pode ser vinculada a um Orçamento (opcional)
ALTER TABLE `cash_flows`
    ADD COLUMN `budgetId` INTEGER NULL;

ALTER TABLE `cash_flows`
    ADD INDEX `cash_flows_budgetId_idx`(`budgetId`);

ALTER TABLE `cash_flows`
    ADD CONSTRAINT `cash_flows_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
