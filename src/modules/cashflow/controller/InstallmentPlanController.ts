import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateInstallmentPlanDTORequest } from '../dto/request/CreateInstallmentPlanDTORequest';
import { InstallmentPlanDTOResponse } from '../dto/response/InstallmentPlanDTOResponse';
import { InstallmentPlanService } from '../service/InstallmentPlanService';

@Controller('cashflow/installments')
export class InstallmentPlanController {
  constructor(private readonly installmentPlanService: InstallmentPlanService) {}

  @Post('preview')
  preview(@Body() dto: CreateInstallmentPlanDTORequest) {
    return this.installmentPlanService.previewInstallments(dto);
  }

  @Post()
  create(@Body() dto: CreateInstallmentPlanDTORequest): Promise<InstallmentPlanDTOResponse> {
    return this.installmentPlanService.create(dto);
  }

  @Get()
  findAll(): Promise<InstallmentPlanDTOResponse[]> {
    return this.installmentPlanService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<InstallmentPlanDTOResponse> {
    return this.installmentPlanService.findById(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number): Promise<InstallmentPlanDTOResponse> {
    return this.installmentPlanService.cancel(id);
  }
}
