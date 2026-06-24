-- Migration: despesas fixas e ganhos fixos
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

CREATE TABLE `fixed_expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `description` VARCHAR(180) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `category` VARCHAR(120) NULL,
    `dueDayOfMonth` TINYINT UNSIGNED NOT NULL,
    `startsOn` DATE NOT NULL,
    `endsOn` DATE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `employeeId` INTEGER NULL,
    `renewedFromId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    INDEX `fixed_expenses_tenantId_idx`(`tenantId`),
    INDEX `fixed_expenses_active_idx`(`active`),
    INDEX `fixed_expenses_employeeId_idx`(`employeeId`),
    INDEX `fixed_expenses_renewedFromId_idx`(`renewedFromId`),
    INDEX `fixed_expenses_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `fixed_incomes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `description` VARCHAR(180) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `category` VARCHAR(120) NULL,
    `dueDayOfMonth` TINYINT UNSIGNED NOT NULL,
    `startsOn` DATE NOT NULL,
    `endsOn` DATE NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `clientId` INTEGER NULL,
    `projectId` INTEGER NULL,
    `renewedFromId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    INDEX `fixed_incomes_tenantId_idx`(`tenantId`),
    INDEX `fixed_incomes_active_idx`(`active`),
    INDEX `fixed_incomes_clientId_idx`(`clientId`),
    INDEX `fixed_incomes_projectId_idx`(`projectId`),
    INDEX `fixed_incomes_renewedFromId_idx`(`renewedFromId`),
    INDEX `fixed_incomes_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fixed_expenses`
    ADD CONSTRAINT `fixed_expenses_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `fixed_expenses_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fixed_expenses_renewedFromId_fkey` FOREIGN KEY (`renewedFromId`) REFERENCES `fixed_expenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `fixed_incomes`
    ADD CONSTRAINT `fixed_incomes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `fixed_incomes_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fixed_incomes_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fixed_incomes_renewedFromId_fkey` FOREIGN KEY (`renewedFromId`) REFERENCES `fixed_incomes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
