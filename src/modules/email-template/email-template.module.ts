import { Module } from '@nestjs/common';
import { EmailTemplateController } from './controller/EmailTemplateController';
import { EmailTemplateRepository } from './repository/EmailTemplateRepository';
import { EmailTemplateService } from './service/EmailTemplateService';

@Module({
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, EmailTemplateRepository],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}
