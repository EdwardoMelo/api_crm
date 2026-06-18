-- Migration: tabela project_files para anexos de projetos (Firebase Storage)
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

CREATE TABLE `project_files` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `tenantId`    INT NOT NULL,
  `projectId`   INT NOT NULL,
  `fileName`    VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(512) NOT NULL,
  `mimeType`    VARCHAR(127) NOT NULL,
  `sizeBytes`   INT NOT NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `project_files_tenantId_projectId_idx` (`tenantId`, `projectId`),
  CONSTRAINT `project_files_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_files_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
