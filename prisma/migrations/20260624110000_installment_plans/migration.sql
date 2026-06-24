-- Migration: parcelamentos (installment plans)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

CREATE TABLE `installment_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `description` VARCHAR(180) NOT NULL,
    `type` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `installmentCount` INTEGER NOT NULL,
    `interestRatePercent` DECIMAL(5, 2) NULL,
    `firstDueDate` DATE NOT NULL,
    `category` VARCHAR(120) NULL,
    `clientId` INTEGER NULL,
    `projectId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    INDEX `installment_plans_tenantId_idx`(`tenantId`),
    INDEX `installment_plans_type_idx`(`type`),
    INDEX `installment_plans_status_idx`(`status`),
    INDEX `installment_plans_clientId_idx`(`clientId`),
    INDEX `installment_plans_projectId_idx`(`projectId`),
    INDEX `installment_plans_employeeId_idx`(`employeeId`),
    INDEX `installment_plans_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `installment_plan_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `installmentPlanId` INTEGER NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `dueDate` DATE NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    UNIQUE INDEX `installment_plan_items_plan_number_key`(`installmentPlanId`, `installmentNumber`),
    INDEX `installment_plan_items_tenantId_idx`(`tenantId`),
    INDEX `installment_plan_items_status_idx`(`status`),
    INDEX `installment_plan_items_dueDate_idx`(`dueDate`),
    INDEX `installment_plan_items_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `installment_plans`
    ADD CONSTRAINT `installment_plans_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `installment_plans_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `installment_plans_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `installment_plans_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `installment_plan_items`
    ADD CONSTRAINT `installment_plan_items_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `installment_plan_items_installmentPlanId_fkey` FOREIGN KEY (`installmentPlanId`) REFERENCES `installment_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
