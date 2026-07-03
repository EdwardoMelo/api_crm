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
} from '@nestjs/common';
import { ClientDTOResponse } from '../../client/dto/response/ClientDTOResponse';
import { ConvertLeadDTORequest } from '../dto/request/ConvertLeadDTORequest';
import { CreateLeadDTORequest } from '../dto/request/CreateLeadDTORequest';
import { ListLeadDTOQuery } from '../dto/request/ListLeadDTOQuery';
import { UpdateLeadDTORequest } from '../dto/request/UpdateLeadDTORequest';
import { LeadDTOResponse } from '../dto/response/LeadDTOResponse';
import { LeadService } from '../service/LeadService';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  create(@Body() dto: CreateLeadDTORequest): Promise<LeadDTOResponse> {
    return this.leadService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListLeadDTOQuery): Promise<LeadDTOResponse[]> {
    return this.leadService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<LeadDTOResponse> {
    return this.leadService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadDTORequest,
  ): Promise<LeadDTOResponse> {
    return this.leadService.update(id, dto);
  }

  @Post(':id/convert')
  convertToClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertLeadDTORequest,
  ): Promise<ClientDTOResponse> {
    return this.leadService.convertToClient(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.leadService.remove(id);
  }
}
