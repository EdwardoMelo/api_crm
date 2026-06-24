import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Observable, from, switchMap } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantResolutionInterceptor implements NestInterceptor {
  constructor(private readonly moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const contextId = ContextIdFactory.getByRequest(request);
    this.moduleRef.registerRequestByContextId(request, contextId);

    return from(
      this.moduleRef.resolve(TenantContextService, contextId).then((tenantContext) =>
        tenantContext.ensureTenantResolved(),
      ),
    ).pipe(switchMap(() => next.handle()));
  }
}
