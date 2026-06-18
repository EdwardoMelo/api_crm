import { Module } from '@nestjs/common';
import { TenantFiscalController } from './controller/TenantFiscalController';
import { TenantFiscalRepository } from './repository/TenantFiscalRepository';
import { TenantFiscalService } from './service/TenantFiscalService';

@Module({
  controllers: [TenantFiscalController],
  providers: [TenantFiscalService, TenantFiscalRepository],
  exports: [TenantFiscalService],
})
export class TenantFiscalModule {}
