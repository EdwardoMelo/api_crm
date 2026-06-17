import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { BudgetController } from './controller/BudgetController';
import { BudgetRepository } from './repository/BudgetRepository';
import { BudgetService } from './service/BudgetService';

@Module({
  imports: [ProjectModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetRepository],
  exports: [BudgetService],
})
export class BudgetModule {}
