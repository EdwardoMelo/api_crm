-- Permite projeto sem cliente: torna projects.clienteId nullable e
-- altera a FK para ON DELETE SET NULL, preservando o projeto ao deletar o cliente.

-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_clienteId_fkey`;

-- AlterColumn (torna clienteId opcional)
ALTER TABLE `projects` MODIFY `clienteId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
