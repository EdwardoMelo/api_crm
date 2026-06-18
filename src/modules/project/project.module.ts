import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ProjectController } from './controller/ProjectController';
import { ProjectFileRepository } from './repository/ProjectFileRepository';
import { ProjectRepository } from './repository/ProjectRepository';
import { ProjectService } from './service/ProjectService';

@Module({
  imports: [StorageModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectFileRepository],
  exports: [ProjectService],
})
export class ProjectModule {}
