import { Module } from '@nestjs/common';
import { FirebaseStorageService } from './firebase-storage.service';
import { FILE_STORAGE } from './storage.interface';

@Module({
  providers: [{ provide: FILE_STORAGE, useClass: FirebaseStorageService }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
