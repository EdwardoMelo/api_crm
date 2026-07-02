-- Migration: auditoria createdBy / updatedBy em asaas_webhook_events
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `asaas_webhook_events`
    ADD COLUMN `createdBy` VARCHAR(20) NOT NULL DEFAULT 'system',
    ADD COLUMN `updatedBy` VARCHAR(20) NOT NULL DEFAULT 'system';

CREATE INDEX `asaas_webhook_events_createdBy_idx` ON `asaas_webhook_events`(`createdBy`);
