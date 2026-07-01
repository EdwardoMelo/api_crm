import { Module } from '@nestjs/common';
import { GeminiService } from './service/GeminiService';

@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GoogleAiModule {}
