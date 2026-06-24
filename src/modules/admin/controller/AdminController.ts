import { Controller, Get, UseGuards } from '@nestjs/common';
import { NoImpersonation } from '../../../common/decorators/no-impersonation.decorator';
import { SystemAdminGuard } from '../../auth/guards/system-admin.guard';
import { AdminDashboardDTOResponse } from '../dto/response/AdminDashboardDTOResponse';
import { AdminTenantListItemDTOResponse } from '../dto/response/AdminTenantListItemDTOResponse';
import { AdminService } from '../service/AdminService';

@Controller('admin')
@UseGuards(SystemAdminGuard)
@NoImpersonation()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants')
  listTenants(): Promise<AdminTenantListItemDTOResponse[]> {
    return this.adminService.listTenants();
  }

  @Get('dashboard')
  getDashboard(): Promise<AdminDashboardDTOResponse> {
    return this.adminService.getDashboard();
  }
}
