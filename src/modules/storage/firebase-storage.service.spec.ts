import { ConfigService } from '@nestjs/config';

const fileMock = {
  save: jest.fn().mockResolvedValue(undefined),
  download: jest.fn().mockResolvedValue([Buffer.from('data')]),
  delete: jest.fn().mockResolvedValue(undefined),
  getSignedUrl: jest.fn().mockResolvedValue(['http://signed']),
};
const bucketMock = { file: jest.fn(() => fileMock) };

jest.mock('firebase-admin/app', () => ({
  applicationDefault: jest.fn(),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));
jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => ({ bucket: jest.fn(() => bucketMock) })),
}));

import { FirebaseStorageService } from './firebase-storage.service';

function build(values: Record<string, string | undefined>): FirebaseStorageService {
  return new FirebaseStorageService({
    get: (key: string) => values[key],
  } as unknown as ConfigService);
}

const config = {
  GOOGLE_APPLICATION_CREDENTIALS: '/creds.json',
  FIREBASE_STORAGE_BUCKET: 'bucket',
};

describe('FirebaseStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanca quando configuracao ausente', async () => {
    const service = build({});
    await expect(service.upload('p', Buffer.from('x'), 'application/pdf')).rejects.toThrow(
      'devem estar configurados',
    );
  });

  it('upload salva no bucket', async () => {
    const service = build(config);
    await service.upload('p', Buffer.from('x'), 'application/pdf');
    expect(fileMock.save).toHaveBeenCalled();
  });

  it('upload propaga erro', async () => {
    const service = build(config);
    fileMock.save.mockRejectedValueOnce(new Error('fail'));
    await expect(service.upload('p', Buffer.from('x'), 'application/pdf')).rejects.toThrow('fail');
  });

  it('download retorna buffer', async () => {
    const service = build(config);
    const result = await service.download('p');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('download propaga erro', async () => {
    const service = build(config);
    fileMock.download.mockRejectedValueOnce(new Error('fail'));
    await expect(service.download('p')).rejects.toThrow('fail');
  });

  it('delete remove arquivo', async () => {
    const service = build(config);
    await service.delete('p');
    expect(fileMock.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
  });

  it('delete propaga erro', async () => {
    const service = build(config);
    fileMock.delete.mockRejectedValueOnce(new Error('fail'));
    await expect(service.delete('p')).rejects.toThrow('fail');
  });

  it('getSignedUrl retorna url', async () => {
    const service = build(config);
    const url = await service.getSignedUrl('p', 1000);
    expect(url).toBe('http://signed');
  });
});
