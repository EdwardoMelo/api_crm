import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { TenantContextService } from './tenant-context.service';
import { TenantResolutionInterceptor } from './tenant-resolution.interceptor';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    TenantContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantResolutionInterceptor,
    },
  ],
  exports: [TenantContextService],
})
export class TenantModule {}
