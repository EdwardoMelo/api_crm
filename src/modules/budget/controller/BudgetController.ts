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
import { ProjectDTOResponse } from '../../project/dto/response/ProjectDTOResponse';
import { CreateBudgetDTORequest } from '../dto/request/CreateBudgetDTORequest';
import { UpdateBudgetDTORequest } from '../dto/request/UpdateBudgetDTORequest';
import { BudgetDTOResponse } from '../dto/response/BudgetDTOResponse';
import { BudgetService } from '../service/BudgetService';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(@Body() dto: CreateBudgetDTORequest): Promise<BudgetDTOResponse> {
    return this.budgetService.create(dto);
  }

  @Get()
  findAll(): Promise<BudgetDTOResponse[]> {
    return this.budgetService.findAll();
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
