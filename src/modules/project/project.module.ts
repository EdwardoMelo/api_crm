import { Module } from '@nestjs/common';
import { ProjectController } from './controller/ProjectController';
import { ProjectRepository } from './repository/ProjectRepository';
import { ProjectService } from './service/ProjectService';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository],
  exports: [ProjectService],
})
export class ProjectModule {}
