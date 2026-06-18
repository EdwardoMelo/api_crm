-- Migration: dados fiscais da empresa (tenant) para emissão de nota fiscal
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

CREATE TABLE `tenant_fiscal_info` (
  `id`                  INT NOT NULL AUTO_INCREMENT,
  `tenantId`            INT NOT NULL,
  `razaoSocial`         VARCHAR(255) NOT NULL,
  `nomeFantasia`        VARCHAR(255) NULL,
  `cnpj`                VARCHAR(14) NOT NULL,
  `inscricaoEstadual`   VARCHAR(30) NULL,
  `inscricaoMunicipal`  VARCHAR(30) NULL,
  `regimeTributario`    ENUM('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI') NULL,
  `cnaePrincipal`       VARCHAR(10) NULL,
  `emailFiscal`         VARCHAR(180) NULL,
  `telefone`            VARCHAR(20) NULL,
  `logradouro`          VARCHAR(255) NULL,
  `numero`              VARCHAR(20) NULL,
  `complemento`         VARCHAR(100) NULL,
  `bairro`              VARCHAR(100) NULL,
  `cep`                 VARCHAR(8) NULL,
  `cidade`              VARCHAR(100) NULL,
  `uf`                  CHAR(2) NULL,
  `codigoIbgeMunicipio` VARCHAR(7) NULL,
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenant_fiscal_info_tenantId_key` (`tenantId`),
  CONSTRAINT `tenant_fiscal_info_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
