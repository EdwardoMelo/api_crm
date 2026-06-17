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
import { CreateEmployeeDTORequest } from '../dto/request/CreateEmployeeDTORequest';
import { UpdateEmployeeDTORequest } from '../dto/request/UpdateEmployeeDTORequest';
import { EmployeeDTOResponse } from '../dto/response/EmployeeDTOResponse';
import { EmployeeService } from '../service/EmployeeService';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDTORequest): Promise<EmployeeDTOResponse> {
    return this.employeeService.create(dto);
  }

  @Get()
  findAll(): Promise<EmployeeDTOResponse[]> {
    return this.employeeService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<EmployeeDTOResponse> {
    return this.employeeService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDTORequest,
  ): Promise<EmployeeDTOResponse> {
    return this.employeeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.employeeService.remove(id);
  }
}
