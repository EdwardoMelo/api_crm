import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Bucket } from '@google-cloud/storage';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { FileStorageProvider } from './storage.interface';

const DEFAULT_SIGNED_URL_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class FirebaseStorageService implements FileStorageProvider {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private bucket?: Bucket;

  constructor(private readonly config: ConfigService) {}

  private getBucket(): Bucket {
    if (!this.bucket) {
      const credentialsPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
      const storageBucket = this.config.get<string>('FIREBASE_STORAGE_BUCKET');

      if (!credentialsPath || !storageBucket) {
        throw new Error(
          'GOOGLE_APPLICATION_CREDENTIALS e FIREBASE_STORAGE_BUCKET devem estar configurados.',
        );
      }

      if (!getApps().length) {
        initializeApp({
          credential: applicationDefault(),
          storageBucket,
        });
      }

      this.bucket = getStorage().bucket(storageBucket);
    }

    return this.bucket;
  }

  async upload(storagePath: string, buffer: Buffer, contentType: string): Promise<void> {
    try {
      const file = this.getBucket().file(storagePath);
      await file.save(buffer, {
        metadata: { contentType },
        resumable: false,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar arquivo ${storagePath}`, (error as Error).stack);
      throw error;
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await this.getBucket().file(storagePath).delete({ ignoreNotFound: true });
    } catch (error) {
      this.logger.error(`Erro ao excluir arquivo ${storagePath}`, (error as Error).stack);
      throw error;
    }
  }

  async getSignedUrl(
    storagePath: string,
    expiresMs: number = DEFAULT_SIGNED_URL_TTL_MS,
  ): Promise<string> {
    const [url] = await this.getBucket().file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresMs,
    });
    return url;
  }
}
