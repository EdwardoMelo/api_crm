-- Migration: tenant billing (Asaas integration)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

-- 1. Catálogo de planos
CREATE TABLE `billing_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
    `intervalDays` INTEGER NOT NULL DEFAULT 30,
    `asaasCycle` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    UNIQUE INDEX `billing_plans_code_key`(`code`),
    INDEX `billing_plans_active_idx`(`active`),
    INDEX `billing_plans_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `billing_plans` (
    `code`,
    `name`,
    `amount`,
    `currency`,
    `intervalDays`,
    `asaasCycle`,
    `active`,
    `updatedAt`,
    `createdBy`,
    `updatedBy`
)
SELECT
    'monthly_default',
    'Plano Mensal',
    50.00,
    'BRL',
    30,
    'MONTHLY',
    true,
    NOW(3),
    'system',
    'system'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `billing_plans` WHERE `code` = 'monthly_default'
);

-- 2. Campos de acesso/billing em tenants
ALTER TABLE `tenants`
    ADD COLUMN `accessExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `billingStatus` ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
    ADD COLUMN `billingPlanId` INTEGER NULL;

ALTER TABLE `tenants`
    ADD INDEX `tenants_billingStatus_idx`(`billingStatus`),
    ADD INDEX `tenants_accessExpiresAt_idx`(`accessExpiresAt`),
    ADD INDEX `tenants_billingPlanId_idx`(`billingPlanId`);

ALTER TABLE `tenants`
    ADD CONSTRAINT `tenants_billingPlanId_fkey` FOREIGN KEY (`billingPlanId`) REFERENCES `billing_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Customer Asaas (1:1 com tenant)
CREATE TABLE `tenant_billing_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `asaasCustomerId` VARCHAR(40) NOT NULL,
    `externalReference` VARCHAR(80) NOT NULL,
    `cpfCnpj` VARCHAR(14) NULL,
    `email` VARCHAR(180) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    UNIQUE INDEX `tenant_billing_accounts_tenantId_key`(`tenantId`),
    UNIQUE INDEX `tenant_billing_accounts_asaasCustomerId_key`(`asaasCustomerId`),
    UNIQUE INDEX `tenant_billing_accounts_externalReference_key`(`externalReference`),
    INDEX `tenant_billing_accounts_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tenant_billing_accounts`
    ADD CONSTRAINT `tenant_billing_accounts_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Assinatura ativa do tenant (1:1)
CREATE TABLE `tenant_subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `billingPlanId` INTEGER NOT NULL,
    `asaasSubscriptionId` VARCHAR(40) NULL,
    `asaasCustomerId` VARCHAR(40) NOT NULL,
    `externalReference` VARCHAR(80) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `autoRenewEnabled` BOOLEAN NOT NULL DEFAULT false,
    `billingType` ENUM('CREDIT_CARD', 'PIX', 'BOLETO', 'UNDEFINED') NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `nextDueDate` DATE NULL,
    `currentPeriodStart` DATETIME(3) NULL,
    `currentPeriodEnd` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    UNIQUE INDEX `tenant_subscriptions_tenantId_key`(`tenantId`),
    UNIQUE INDEX `tenant_subscriptions_asaasSubscriptionId_key`(`asaasSubscriptionId`),
    UNIQUE INDEX `tenant_subscriptions_externalReference_key`(`externalReference`),
    INDEX `tenant_subscriptions_billingPlanId_idx`(`billingPlanId`),
    INDEX `tenant_subscriptions_status_idx`(`status`),
    INDEX `tenant_subscriptions_asaasCustomerId_idx`(`asaasCustomerId`),
    INDEX `tenant_subscriptions_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tenant_subscriptions`
    ADD CONSTRAINT `tenant_subscriptions_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `tenant_subscriptions_billingPlanId_fkey` FOREIGN KEY (`billingPlanId`) REFERENCES `billing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Espelho de cobranças Asaas (payments)
CREATE TABLE `billing_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `tenantSubscriptionId` INTEGER NULL,
    `billingPlanId` INTEGER NOT NULL,
    `asaasPaymentId` VARCHAR(40) NULL,
    `asaasSubscriptionId` VARCHAR(40) NULL,
    `asaasCustomerId` VARCHAR(40) NOT NULL,
    `externalReference` VARCHAR(80) NOT NULL,
    `billingType` ENUM('CREDIT_CARD', 'PIX', 'BOLETO', 'UNDEFINED') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATE NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `invoiceUrl` VARCHAR(512) NULL,
    `bankSlipUrl` VARCHAR(512) NULL,
    `failureCode` VARCHAR(80) NULL,
    `failureMessage` VARCHAR(500) NULL,
    `failedAt` DATETIME(3) NULL,
    `lastAsaasEvent` VARCHAR(80) NULL,
    `accessGranted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system',

    UNIQUE INDEX `billing_payments_asaasPaymentId_key`(`asaasPaymentId`),
    UNIQUE INDEX `billing_payments_externalReference_key`(`externalReference`),
    INDEX `billing_payments_tenantId_idx`(`tenantId`),
    INDEX `billing_payments_tenantSubscriptionId_idx`(`tenantSubscriptionId`),
    INDEX `billing_payments_billingPlanId_idx`(`billingPlanId`),
    INDEX `billing_payments_status_idx`(`status`),
    INDEX `billing_payments_dueDate_idx`(`dueDate`),
    INDEX `billing_payments_asaasSubscriptionId_idx`(`asaasSubscriptionId`),
    INDEX `billing_payments_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `billing_payments_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `billing_payments`
    ADD CONSTRAINT `billing_payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `billing_payments_tenantSubscriptionId_fkey` FOREIGN KEY (`tenantSubscriptionId`) REFERENCES `tenant_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `billing_payments_billingPlanId_fkey` FOREIGN KEY (`billingPlanId`) REFERENCES `billing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Webhooks Asaas (idempotência + auditoria)
CREATE TABLE `asaas_webhook_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asaasEventId` VARCHAR(120) NOT NULL,
    `eventType` VARCHAR(80) NOT NULL,
    `tenantId` INTEGER NULL,
    `billingPaymentId` INTEGER NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` VARCHAR(500) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asaas_webhook_events_asaasEventId_key`(`asaasEventId`),
    INDEX `asaas_webhook_events_eventType_idx`(`eventType`),
    INDEX `asaas_webhook_events_tenantId_idx`(`tenantId`),
    INDEX `asaas_webhook_events_billingPaymentId_idx`(`billingPaymentId`),
    INDEX `asaas_webhook_events_status_idx`(`status`),
    INDEX `asaas_webhook_events_receivedAt_idx`(`receivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `asaas_webhook_events`
    ADD CONSTRAINT `asaas_webhook_events_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `asaas_webhook_events_billingPaymentId_fkey` FOREIGN KEY (`billingPaymentId`) REFERENCES `billing_payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
