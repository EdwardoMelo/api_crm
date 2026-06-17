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
import { CreateProjectDTORequest } from '../dto/request/CreateProjectDTORequest';
import { UpdateProjectDTORequest } from '../dto/request/UpdateProjectDTORequest';
import { ProjectDTOResponse } from '../dto/response/ProjectDTOResponse';
import { ProjectService } from '../service/ProjectService';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() dto: CreateProjectDTORequest): Promise<ProjectDTOResponse> {
    return this.projectService.create(dto);
  }

  @Get()
  findAll(): Promise<ProjectDTOResponse[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<ProjectDTOResponse> {
    return this.projectService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDTORequest,
  ): Promise<ProjectDTOResponse> {
    return this.projectService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectService.remove(id);
  }
}
