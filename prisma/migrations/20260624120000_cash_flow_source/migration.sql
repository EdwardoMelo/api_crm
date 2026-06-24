-- Migration: vínculo de cash_flows com fixos e parcelamentos
-- Após aplicar este SQL no banco, rode:
--   npx prisma db pull && npx prisma generate

ALTER TABLE `cash_flows`
    ADD COLUMN `sourceType` ENUM('MANUAL', 'FIXED_EXPENSE', 'FIXED_INCOME', 'INSTALLMENT') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `fixedExpenseId` INTEGER NULL,
    ADD COLUMN `fixedIncomeId` INTEGER NULL,
    ADD COLUMN `installmentPlanItemId` INTEGER NULL,
    ADD INDEX `cash_flows_sourceType_idx`(`sourceType`),
    ADD INDEX `cash_flows_fixedExpenseId_idx`(`fixedExpenseId`),
    ADD INDEX `cash_flows_fixedIncomeId_idx`(`fixedIncomeId`),
    ADD UNIQUE INDEX `cash_flows_installmentPlanItemId_key`(`installmentPlanItemId`),
    ADD UNIQUE INDEX `cash_flows_tenant_fixed_expense_competence_key`(`tenantId`, `fixedExpenseId`, `dataCompetencia`),
    ADD UNIQUE INDEX `cash_flows_tenant_fixed_income_competence_key`(`tenantId`, `fixedIncomeId`, `dataCompetencia`);

ALTER TABLE `cash_flows`
    ADD CONSTRAINT `cash_flows_fixedExpenseId_fkey` FOREIGN KEY (`fixedExpenseId`) REFERENCES `fixed_expenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `cash_flows_fixedIncomeId_fkey` FOREIGN KEY (`fixedIncomeId`) REFERENCES `fixed_incomes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `cash_flows_installmentPlanItemId_fkey` FOREIGN KEY (`installmentPlanItemId`) REFERENCES `installment_plan_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
