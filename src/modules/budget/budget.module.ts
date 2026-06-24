import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ProjectModule } from '../project/project.module';
import { StorageModule } from '../storage/storage.module';
import { TenantFiscalModule } from '../tenant-fiscal/tenant-fiscal.module';
import { BudgetController } from './controller/BudgetController';
import { BudgetEmailTemplateController } from './controller/BudgetEmailTemplateController';
import { BudgetEmailTemplateRepository } from './repository/BudgetEmailTemplateRepository';
import { BudgetFileRepository } from './repository/BudgetFileRepository';
import { BudgetRepository } from './repository/BudgetRepository';
import { BudgetEmailService } from './service/BudgetEmailService';
import { BudgetEmailTemplateService } from './service/BudgetEmailTemplateService';
import { BudgetFileService } from './service/BudgetFileService';
import { BudgetService } from './service/BudgetService';

@Module({
  imports: [ProjectModule, EmailModule, StorageModule, TenantFiscalModule],
  controllers: [BudgetController, BudgetEmailTemplateController],
  providers: [
    BudgetService,
    BudgetRepository,
    BudgetFileService,
    BudgetFileRepository,
    BudgetEmailService,
    BudgetEmailTemplateService,
    BudgetEmailTemplateRepository,
  ],
  exports: [BudgetService],
})
export class BudgetModule {}
