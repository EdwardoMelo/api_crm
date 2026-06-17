import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateClientDTORequest } from '../dto/request/CreateClientDTORequest';
import { UpdateClientDTORequest } from '../dto/request/UpdateClientDTORequest';
import { ClientDTOResponse } from '../dto/response/ClientDTOResponse';
import { ClientService } from '../service/ClientService';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() dto: CreateClientDTORequest): Promise<ClientDTOResponse> {
    return this.clientService.create(dto);
  }

  @Get()
  findAll(): Promise<ClientDTOResponse[]> {
    return this.clientService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<ClientDTOResponse> {
    return this.clientService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDTORequest,
  ): Promise<ClientDTOResponse> {
    return this.clientService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.clientService.remove(id);
  }
}
