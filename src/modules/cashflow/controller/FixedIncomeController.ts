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
  CreateFixedIncomeDTORequest,
  RenewFixedIncomeDTORequest,
  UpdateFixedIncomeDTORequest,
} from '../dto/request/FixedIncomeDTORequest';
import { FixedIncomeDTOResponse } from '../dto/response/FixedIncomeDTOResponse';
import { CashFlowDTOResponse } from '../dto/response/CashFlowDTOResponse';
import { FixedIncomeService } from '../service/FixedIncomeService';

@Controller('cashflow/fixed-incomes')
export class FixedIncomeController {
  constructor(private readonly fixedIncomeService: FixedIncomeService) {}

  @Post()
  create(@Body() dto: CreateFixedIncomeDTORequest): Promise<FixedIncomeDTOResponse> {
    return this.fixedIncomeService.create(dto);
  }

  @Get()
  findAll(): Promise<FixedIncomeDTOResponse[]> {
    return this.fixedIncomeService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<FixedIncomeDTOResponse> {
    return this.fixedIncomeService.findById(id);
  }

  @Get(':id/cash-flows')
  findCashFlows(@Param('id', ParseIntPipe) id: number): Promise<CashFlowDTOResponse[]> {
    return this.fixedIncomeService.findCashFlows(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFixedIncomeDTORequest,
  ): Promise<FixedIncomeDTOResponse> {
    return this.fixedIncomeService.update(id, dto);
  }

  @Post(':id/renew')
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenewFixedIncomeDTORequest,
  ): Promise<FixedIncomeDTOResponse> {
    return this.fixedIncomeService.renew(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.fixedIncomeService.remove(id);
  }
}
