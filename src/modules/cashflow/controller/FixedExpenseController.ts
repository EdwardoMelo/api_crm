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
  CreateFixedExpenseDTORequest,
  RenewFixedExpenseDTORequest,
  UpdateFixedExpenseDTORequest,
} from '../dto/request/FixedExpenseDTORequest';
import { FixedExpenseDTOResponse } from '../dto/response/FixedExpenseDTOResponse';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { FixedExpenseService } from '../service/FixedExpenseService';

@Controller('cashflow/fixed-expenses')
export class FixedExpenseController {
  constructor(private readonly fixedExpenseService: FixedExpenseService) {}

  @Post()
  create(@Body() dto: CreateFixedExpenseDTORequest): Promise<FixedExpenseDTOResponse> {
    return this.fixedExpenseService.create(dto);
  }

  @Get()
  findAll(): Promise<FixedExpenseDTOResponse[]> {
    return this.fixedExpenseService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<FixedExpenseDTOResponse> {
    return this.fixedExpenseService.findById(id);
  }

  @Get(':id/cash-flows')
  findCashFlows(@Param('id', ParseIntPipe) id: number): Promise<CashFlowDTOResponse[]> {
    return this.fixedExpenseService.findCashFlows(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFixedExpenseDTORequest,
  ): Promise<FixedExpenseDTOResponse> {
    return this.fixedExpenseService.update(id, dto);
  }

  @Post(':id/renew')
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenewFixedExpenseDTORequest,
  ): Promise<FixedExpenseDTOResponse> {
    return this.fixedExpenseService.renew(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.fixedExpenseService.remove(id);
  }
}
