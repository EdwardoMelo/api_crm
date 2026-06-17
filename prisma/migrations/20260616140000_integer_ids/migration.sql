-- Migration: altera todos os IDs de VARCHAR (uuid) para INT AUTO_INCREMENT
-- ATENÇÃO: esta migration remove todos os dados existentes nas tabelas afetadas.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `cash_flows`;
DROP TABLE IF EXISTS `email_logs`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `clients`;

SET FOREIGN_KEY_CHECKS = 1;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `empresa` VARCHAR(191) NULL,
    `documento` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clients_nome_idx`(`nome`),
    INDEX `clients_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `cargo` VARCHAR(191) NULL,
    `tipoContratacao` ENUM('CLT', 'PJ', 'FREELANCER', 'PARCEIRO') NOT NULL,
    `salarioBase` DECIMAL(12, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `employees_nome_idx`(`nome`),
    INDEX `employees_tipoContratacao_idx`(`tipoContratacao`),
    INDEX `employees_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('RASCUNHO', 'ENVIADO', 'APROVADO', 'REPROVADO', 'CANCELADO', 'CONVERTIDO') NOT NULL DEFAULT 'RASCUNHO',
    `dataValidade` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budgets_clienteId_idx`(`clienteId`),
    INDEX `budgets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `budgetId` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `valorTotal` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PLANEJADO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'PLANEJADO',
    `dataInicio` DATETIME(3) NULL,
    `dataFimPrevista` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projects_budgetId_key`(`budgetId`),
    INDEX `projects_clienteId_idx`(`clienteId`),
    INDEX `projects_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_flows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `dataCompetencia` DATETIME(3) NOT NULL,
    `dataPagamento` DATETIME(3) NULL,
    `categoria` VARCHAR(191) NULL,
    `projectId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cash_flows_tipo_idx`(`tipo`),
    INDEX `cash_flows_status_idx`(`status`),
    INDEX `cash_flows_dataCompetencia_idx`(`dataCompetencia`),
    INDEX `cash_flows_projectId_idx`(`projectId`),
    INDEX `cash_flows_clientId_idx`(`clientId`),
    INDEX `cash_flows_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `destinatario` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `status` ENUM('PENDENTE', 'ENVIADO', 'FALHA') NOT NULL DEFAULT 'PENDENTE',
    `dataEnvio` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_logs_destinatario_idx`(`destinatario`),
    INDEX `email_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flows` ADD CONSTRAINT `cash_flows_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flows` ADD CONSTRAINT `cash_flows_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_flows` ADD CONSTRAINT `cash_flows_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
