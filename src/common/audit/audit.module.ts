import { Global, Module } from '@nestjs/common';
import { ActorContextService } from './actor-context.service';

@Global()
@Module({
  providers: [ActorContextService],
  exports: [ActorContextService],
})
export class AuditModule {}
