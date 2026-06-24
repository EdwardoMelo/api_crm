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
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectDTOResponse } from '../../project/dto/response/ProjectDTOResponse';
import { CreateBudgetDTORequest } from '../dto/request/CreateBudgetDTORequest';
import { ListBudgetDTOQuery } from '../dto/request/ListBudgetDTOQuery';
import { PreviewEmailTemplateBodyDTORequest } from '../../email-template/dto/request/EmailTemplateDTORequest';
import { EmailTemplatePreviewDTOResponse } from '../../email-template/dto/response/EmailTemplateDTOResponse';
import { SendBudgetEmailDTORequest } from '../dto/request/SendBudgetEmailDTORequest';
import { UpdateBudgetDTORequest } from '../dto/request/UpdateBudgetDTORequest';
import { BudgetEmailContextDTOResponse, SendBudgetEmailResultDTOResponse } from '../dto/response/BudgetEmailContextDTOResponse';
import { BudgetFileDTOResponse } from '../dto/response/BudgetFileDTOResponse';
import { BudgetDTOResponse } from '../dto/response/BudgetDTOResponse';
import { BudgetEmailService } from '../service/BudgetEmailService';
import { BudgetFileService } from '../service/BudgetFileService';
import { BudgetService } from '../service/BudgetService';
import { MAX_BUDGET_FILE_SIZE_BYTES } from '../utils/budget-file.utils';

@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly budgetFileService: BudgetFileService,
    private readonly budgetEmailService: BudgetEmailService,
  ) {}

  @Post()
  create(@Body() dto: CreateBudgetDTORequest): Promise<BudgetDTOResponse> {
    return this.budgetService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListBudgetDTOQuery): Promise<BudgetDTOResponse[]> {
    return this.budgetService.findAll(query);
  }

  @Get(':id/email-context')
  getEmailContext(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetEmailContextDTOResponse> {
    return this.budgetEmailService.getEmailContext(id);
  }

  @Post(':id/email-template-preview')
  previewEmailTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PreviewEmailTemplateBodyDTORequest,
  ): Promise<EmailTemplatePreviewDTOResponse> {
    return this.budgetEmailService.previewTemplate(id, dto);
  }

  @Post(':id/file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BUDGET_FILE_SIZE_BYTES },
    }),
  )
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BudgetFileDTOResponse> {
    return this.budgetFileService.uploadFile(id, file);
  }

  @Get(':id/file')
  getFile(@Param('id', ParseIntPipe) id: number): Promise<BudgetFileDTOResponse | null> {
    return this.budgetFileService.getFile(id);
  }

  @Delete(':id/file')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.budgetFileService.deleteFile(id);
  }

  @Post(':id/send-email')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BUDGET_FILE_SIZE_BYTES },
    }),
  )
  sendEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendBudgetEmailDTORequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SendBudgetEmailResultDTOResponse> {
    return this.budgetEmailService.sendEmail(id, dto, file);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<BudgetDTOResponse> {
    return this.budgetService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDTORequest,
  ): Promise<BudgetDTOResponse> {
    return this.budgetService.update(id, dto);
  }

  @Post(':id/convert')
  convertToProject(@Param('id', ParseIntPipe) id: number): Promise<ProjectDTOResponse> {
    return this.budgetService.convertToProject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.budgetService.remove(id);
  }
}
