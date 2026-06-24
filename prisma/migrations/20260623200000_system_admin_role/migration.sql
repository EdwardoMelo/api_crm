-- Migration: papel SYSTEM_ADMIN para gestão da plataforma
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('ADMIN', 'USUARIO', 'SYSTEM_ADMIN') NOT NULL DEFAULT 'USUARIO';
