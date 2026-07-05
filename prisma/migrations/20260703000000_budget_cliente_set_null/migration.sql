-- Altera o relacionamento budgets -> clients para ON DELETE SET NULL,
-- assim ao deletar um cliente os orçamentos são preservados (clienteId vira NULL).

-- DropForeignKey
ALTER TABLE `budgets` DROP FOREIGN KEY `budgets_clienteId_fkey`;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
