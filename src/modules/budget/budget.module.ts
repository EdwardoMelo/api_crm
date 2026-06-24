import { Module } from '@nestjs/common';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { EmailModule } from '../email/email.module';
import { ProjectModule } from '../project/project.module';
import { StorageModule } from '../storage/storage.module';
import { TenantFiscalModule } from '../tenant-fiscal/tenant-fiscal.module';
import { BudgetController } from './controller/BudgetController';
import { BudgetFileRepository } from './repository/BudgetFileRepository';
import { BudgetRepository } from './repository/BudgetRepository';
import { BudgetEmailService } from './service/BudgetEmailService';
import { BudgetFileService } from './service/BudgetFileService';
import { BudgetService } from './service/BudgetService';

@Module({
  imports: [ProjectModule, EmailModule, EmailTemplateModule, StorageModule, TenantFiscalModule],
  controllers: [BudgetController],
  providers: [
    BudgetService,
    BudgetRepository,
    BudgetFileService,
    BudgetFileRepository,
    BudgetEmailService,
  ],
  exports: [BudgetService],
})
export class BudgetModule {}
