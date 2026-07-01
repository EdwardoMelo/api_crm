import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  EMAIL_TEMPLATE_VARIABLE_KEYS,
  EMAIL_TEMPLATE_VARIABLE_LABELS,
} from '../constants/email-template-variables.constants';
import {
  CreateEmailTemplateDTORequest,
  UpdateEmailTemplateDTORequest,
} from '../dto/request/EmailTemplateDTORequest';
import { SuggestEmailTemplateDTORequest } from '../dto/request/SuggestEmailTemplateDTORequest';
import { EmailTemplateDTOResponse } from '../dto/response/EmailTemplateDTOResponse';
import { SuggestEmailTemplateDTOResponse } from '../dto/response/SuggestEmailTemplateDTOResponse';
import { EmailTemplateService } from '../service/EmailTemplateService';
import { EmailTemplateSuggestionService } from '../service/EmailTemplateSuggestionService';

@Controller('email-templates')
export class EmailTemplateController {
  constructor(
    private readonly templateService: EmailTemplateService,
    private readonly suggestionService: EmailTemplateSuggestionService,
  ) {}

  @Get('variables')
  listVariables(): { key: string; label: string }[] {
    return EMAIL_TEMPLATE_VARIABLE_KEYS.map((key) => ({
      key,
      label: EMAIL_TEMPLATE_VARIABLE_LABELS[key],
    }));
  }

  @Get()
  findAll(): Promise<EmailTemplateDTOResponse[]> {
    return this.templateService.findAll();
  }

  @Post('suggest')
  suggest(
    @Body() dto: SuggestEmailTemplateDTORequest,
  ): Promise<SuggestEmailTemplateDTOResponse> {
    return this.suggestionService.suggest(dto);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<EmailTemplateDTOResponse> {
    return this.templateService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateEmailTemplateDTORequest): Promise<EmailTemplateDTOResponse> {
    return this.templateService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmailTemplateDTORequest,
  ): Promise<EmailTemplateDTOResponse> {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.templateService.remove(id);
  }
}
