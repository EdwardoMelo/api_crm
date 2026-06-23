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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateCashFlowDTORequest } from '../dto/request/CreateCashFlowDTORequest';
import { UpdateCashFlowDTORequest } from '../dto/request/UpdateCashFlowDTORequest';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowService } from '../service/CashFlowService';
import { MAX_CASH_FLOW_INVOICE_SIZE_BYTES } from '../utils/cash-flow-invoice.utils';

@Controller('cashflow')
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Post()
  create(@Body() dto: CreateCashFlowDTORequest): Promise<CashFlowDTOResponse> {
    return this.cashFlowService.create(dto);
  }

  @Get()
  findAll(): Promise<CashFlowDTOResponse[]> {
    return this.cashFlowService.findAll();
  }

  @Post(':id/nota-fiscal')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CASH_FLOW_INVOICE_SIZE_BYTES },
    }),
  )
  uploadNotaFiscal(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CashFlowDTOResponse> {
    return this.cashFlowService.uploadNotaFiscal(id, file);
  }

  @Delete(':id/nota-fiscal')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeNotaFiscal(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cashFlowService.removeNotaFiscal(id);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<CashFlowDTOResponse> {
    return this.cashFlowService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCashFlowDTORequest,
  ): Promise<CashFlowDTOResponse> {
    return this.cashFlowService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cashFlowService.remove(id);
  }
}
