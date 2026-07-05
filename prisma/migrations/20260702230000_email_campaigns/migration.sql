-- Migration: campanhas de e-mail em massa (email_campaigns) + fila de envios (queued_emails)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate
--
-- Observação: status e recipientType usam VARCHAR (não ENUM) de propósito,
-- para que o código da aplicação não dependa dos nomes de enum gerados pelo
-- `prisma db pull`. Os valores válidos são controlados na camada de aplicação.

-- 1. Campanha (entidade pai que agrupa os envios)
CREATE TABLE `email_campaigns` (
  `id`                 INT NOT NULL AUTO_INCREMENT,
  `tenantId`           INT NOT NULL,
  `templateId`         INT NULL,
  `assunto`            VARCHAR(255) NOT NULL,
  `corpo`              TEXT NOT NULL,
  `anexoPath`          VARCHAR(512) NULL,
  `anexoNome`          VARCHAR(255) NULL,
  `anexoMime`          VARCHAR(127) NULL,
  `anexoTamanho`       INT NULL,
  `status`             VARCHAR(30) NOT NULL DEFAULT 'PROCESSANDO',
  `totalDestinatarios` INT NOT NULL DEFAULT 0,
  `totalEnviados`      INT NOT NULL DEFAULT 0,
  `totalFalhados`      INT NOT NULL DEFAULT 0,
  `totalIgnorados`     INT NOT NULL DEFAULT 0,
  `createdAt`          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy`          VARCHAR(20) NOT NULL DEFAULT 'system',
  `updatedBy`          VARCHAR(20) NOT NULL DEFAULT 'system',
  PRIMARY KEY (`id`),
  INDEX `email_campaigns_tenantId_idx` (`tenantId`),
  INDEX `email_campaigns_templateId_idx` (`templateId`),
  INDEX `email_campaigns_status_idx` (`status`),
  CONSTRAINT `email_campaigns_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `email_campaigns_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `email_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Envios individuais (1 linha por destinatário) — fila + histórico por campanha
CREATE TABLE `queued_emails` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `tenantId`      INT NOT NULL,
  `campaignId`    INT NOT NULL,
  `recipientType` VARCHAR(20) NOT NULL,
  `recipientId`   INT NOT NULL,
  `destinatario`  VARCHAR(255) NOT NULL,
  `assunto`       VARCHAR(255) NOT NULL,
  `corpo`         TEXT NOT NULL,
  `status`        VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  `erro`          TEXT NULL,
  `tentativas`    INT NOT NULL DEFAULT 0,
  `dataEnvio`     DATETIME(3) NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy`     VARCHAR(20) NOT NULL DEFAULT 'system',
  `updatedBy`     VARCHAR(20) NOT NULL DEFAULT 'system',
  PRIMARY KEY (`id`),
  INDEX `queued_emails_tenantId_campaignId_idx` (`tenantId`, `campaignId`),
  INDEX `queued_emails_status_idx` (`status`),
  CONSTRAINT `queued_emails_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `queued_emails_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `email_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
