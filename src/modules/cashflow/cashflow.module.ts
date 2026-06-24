import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CashFlowController } from './controller/CashFlowController';
import { FixedExpenseController } from './controller/FixedExpenseController';
import { FixedIncomeController } from './controller/FixedIncomeController';
import { InstallmentPlanController } from './controller/InstallmentPlanController';
import { CashFlowRepository } from './repository/CashFlowRepository';
import { FixedExpenseRepository } from './repository/FixedExpenseRepository';
import { FixedIncomeRepository } from './repository/FixedIncomeRepository';
import { InstallmentPlanRepository } from './repository/InstallmentPlanRepository';
import { CashFlowGenerationService } from './service/CashFlowGenerationService';
import { CashFlowService } from './service/CashFlowService';
import { FixedExpenseService } from './service/FixedExpenseService';
import { FixedIncomeService } from './service/FixedIncomeService';
import { InstallmentPlanService } from './service/InstallmentPlanService';

@Module({
  imports: [StorageModule],
  controllers: [
    FixedExpenseController,
    FixedIncomeController,
    InstallmentPlanController,
    CashFlowController,
  ],
  providers: [
    CashFlowService,
    CashFlowGenerationService,
    FixedExpenseService,
    FixedIncomeService,
    InstallmentPlanService,
    CashFlowRepository,
    FixedExpenseRepository,
    FixedIncomeRepository,
    InstallmentPlanRepository,
  ],
  exports: [CashFlowService, CashFlowRepository, CashFlowGenerationService],
})
export class CashFlowModule {}
