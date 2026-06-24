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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateProjectDTORequest } from '../dto/request/CreateProjectDTORequest';
import { ListProjectDTOQuery } from '../dto/request/ListProjectDTOQuery';
import { UpdateProjectDTORequest } from '../dto/request/UpdateProjectDTORequest';
import { ProjectDTOResponse } from '../dto/response/ProjectDTOResponse';
import { ProjectFileDTOResponse } from '../dto/response/ProjectFileDTOResponse';
import { ProjectService } from '../service/ProjectService';
import { MAX_PROJECT_FILE_SIZE_BYTES } from '../utils/project-file.utils';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() dto: CreateProjectDTORequest): Promise<ProjectDTOResponse> {
    return this.projectService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListProjectDTOQuery): Promise<ProjectDTOResponse[]> {
    return this.projectService.findAll(query);
  }

  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROJECT_FILE_SIZE_BYTES },
    }),
  )
  addFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProjectFileDTOResponse> {
    return this.projectService.addFile(id, file);
  }

  @Get(':id/files')
  listFiles(@Param('id', ParseIntPipe) id: number): Promise<ProjectFileDTOResponse[]> {
    return this.projectService.listFiles(id);
  }

  @Delete(':id/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ): Promise<void> {
    return this.projectService.deleteFile(id, fileId);
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
