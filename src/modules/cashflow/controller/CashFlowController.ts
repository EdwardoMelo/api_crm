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
import { CreateCashFlowDTORequest } from '../dto/request/CreateCashFlowDTORequest';
import { UpdateCashFlowDTORequest } from '../dto/request/UpdateCashFlowDTORequest';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { CashFlowService } from '../service/CashFlowService';

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
