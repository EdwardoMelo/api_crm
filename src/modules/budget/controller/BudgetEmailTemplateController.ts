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
  CreateBudgetEmailTemplateDTORequest,
  PreviewBudgetEmailTemplateDTORequest,
  UpdateBudgetEmailTemplateDTORequest,
} from '../dto/request/BudgetEmailTemplateDTORequest';
import { BudgetEmailTemplatePreviewDTOResponse } from '../dto/response/BudgetEmailContextDTOResponse';
import { BudgetEmailTemplateDTOResponse } from '../dto/response/BudgetEmailTemplateDTOResponse';
import { BudgetEmailService } from '../service/BudgetEmailService';
import { BudgetEmailTemplateService } from '../service/BudgetEmailTemplateService';
import { BUDGET_EMAIL_VARIABLE_KEYS, BUDGET_EMAIL_VARIABLE_LABELS } from '../constants/budget-email-variables.constants';

@Controller('budget-email-templates')
export class BudgetEmailTemplateController {
  constructor(
    private readonly templateService: BudgetEmailTemplateService,
    private readonly budgetEmailService: BudgetEmailService,
  ) {}

  @Get('variables')
  listVariables(): { key: string; label: string }[] {
    return BUDGET_EMAIL_VARIABLE_KEYS.map((key) => ({
      key,
      label: BUDGET_EMAIL_VARIABLE_LABELS[key],
    }));
  }

  @Get()
  findAll(): Promise<BudgetEmailTemplateDTOResponse[]> {
    return this.templateService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<BudgetEmailTemplateDTOResponse> {
    return this.templateService.findById(id);
  }

  @Post('preview')
  preview(
    @Body() dto: PreviewBudgetEmailTemplateDTORequest,
  ): Promise<BudgetEmailTemplatePreviewDTOResponse> {
    return this.budgetEmailService.previewTemplate(dto);
  }

  @Post()
  create(
    @Body() dto: CreateBudgetEmailTemplateDTORequest,
  ): Promise<BudgetEmailTemplateDTOResponse> {
    return this.templateService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetEmailTemplateDTORequest,
  ): Promise<BudgetEmailTemplateDTOResponse> {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.templateService.remove(id);
  }
}
