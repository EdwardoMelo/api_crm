import { Module } from '@nestjs/common';
import { GoogleAiModule } from '../google-ai/google-ai.module';
import { EmailTemplateController } from './controller/EmailTemplateController';
import { EmailTemplateRepository } from './repository/EmailTemplateRepository';
import { EmailTemplateService } from './service/EmailTemplateService';
import { EmailTemplateSuggestionService } from './service/EmailTemplateSuggestionService';

@Module({
  imports: [GoogleAiModule],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, EmailTemplateSuggestionService, EmailTemplateRepository],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}
