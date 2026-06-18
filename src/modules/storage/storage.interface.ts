export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStorageProvider {
  upload(storagePath: string, buffer: Buffer, contentType: string): Promise<void>;
  delete(storagePath: string): Promise<void>;
  getSignedUrl(storagePath: string, expiresMs?: number): Promise<string>;
}
