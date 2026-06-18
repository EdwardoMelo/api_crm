import { Body, Controller, Get, Put } from '@nestjs/common';
import { UpsertTenantFiscalInfoDTORequest } from '../dto/request/UpsertTenantFiscalInfoDTORequest';
import { TenantFiscalInfoDTOResponse } from '../dto/response/TenantFiscalInfoDTOResponse';
import { TenantFiscalService } from '../service/TenantFiscalService';

@Controller('tenant/fiscal-info')
export class TenantFiscalController {
  constructor(private readonly tenantFiscalService: TenantFiscalService) {}

  @Get()
  getFiscalInfo(): Promise<TenantFiscalInfoDTOResponse | null> {
    return this.tenantFiscalService.getFiscalInfo();
  }

  @Put()
  upsertFiscalInfo(
    @Body() dto: UpsertTenantFiscalInfoDTORequest,
  ): Promise<TenantFiscalInfoDTOResponse> {
    return this.tenantFiscalService.upsertFiscalInfo(dto);
  }
}
