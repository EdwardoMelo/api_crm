import { Module } from '@nestjs/common';
import { CashFlowController } from './controller/CashFlowController';
import { CashFlowRepository } from './repository/CashFlowRepository';
import { CashFlowService } from './service/CashFlowService';

@Module({
  controllers: [CashFlowController],
  providers: [CashFlowService, CashFlowRepository],
  exports: [CashFlowService, CashFlowRepository],
})
export class CashFlowModule {}
