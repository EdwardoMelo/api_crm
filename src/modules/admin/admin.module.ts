import { Module } from '@nestjs/common';
import { SystemAdminGuard } from '../auth/guards/system-admin.guard';
import { AdminController } from './controller/AdminController';
import { AdminRepository } from './repository/AdminRepository';
import { AdminService } from './service/AdminService';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, SystemAdminGuard],
})
export class AdminModule {}
