import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CashFlowController } from './controller/CashFlowController';
import { CashFlowRepository } from './repository/CashFlowRepository';
import { CashFlowService } from './service/CashFlowService';

@Module({
  imports: [StorageModule],
  controllers: [CashFlowController],
  providers: [CashFlowService, CashFlowRepository],
  exports: [CashFlowService, CashFlowRepository],
})
export class CashFlowModule {}
