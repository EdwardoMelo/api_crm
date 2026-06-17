import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from './common/tenant';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ProjectModule } from './modules/project/project.module';
import { BudgetModule } from './modules/budget/budget.module';
import { CashFlowModule } from './modules/cashflow/cashflow.module';
import { EmailModule } from './modules/email/email.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TenantModule,
    PrismaModule,
    AuthModule,
    ClientModule,
    EmployeeModule,
    ProjectModule,
    BudgetModule,
    CashFlowModule,
    EmailModule,
    DashboardModule,
  ],
})
export class AppModule {}
