import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './common/audit';
import { TenantModule } from './common/tenant';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { LeadModule } from './modules/lead/lead.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ProjectModule } from './modules/project/project.module';
import { BudgetModule } from './modules/budget/budget.module';
import { CashFlowModule } from './modules/cashflow/cashflow.module';
import { EmailModule } from './modules/email/email.module';
import { EmailTemplateModule } from './modules/email-template/email-template.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StorageModule } from './modules/storage/storage.module';
import { TenantFiscalModule } from './modules/tenant-fiscal/tenant-fiscal.module';
import { AdminModule } from './modules/admin/admin.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TenantModule,
    AuditModule,
    PrismaModule,
    AuthModule,
    ClientModule,
    LeadModule,
    EmployeeModule,
    ProjectModule,
    BudgetModule,
    CashFlowModule,
    EmailModule,
    EmailTemplateModule,
    DashboardModule,
    StorageModule,
    TenantFiscalModule,
    AdminModule,
    BillingModule,
  ],
})
export class AppModule {}
