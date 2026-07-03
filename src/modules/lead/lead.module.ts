import { Module } from '@nestjs/common';
import { ClientModule } from '../client/client.module';
import { LeadController } from './controller/LeadController';
import { LeadRepository } from './repository/LeadRepository';
import { LeadService } from './service/LeadService';

@Module({
  imports: [ClientModule],
  controllers: [LeadController],
  providers: [LeadService, LeadRepository],
  exports: [LeadService],
})
export class LeadModule {}
