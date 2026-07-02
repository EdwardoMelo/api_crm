import { Test, TestingModule } from '@nestjs/testing';
import { TenantFiscalController } from './controller/TenantFiscalController';
import { TenantFiscalService } from './service/TenantFiscalService';

describe('TenantFiscalController', () => {
  let controller: TenantFiscalController;
  let service: jest.Mocked<TenantFiscalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantFiscalController],
      providers: [
        {
          provide: TenantFiscalService,
          useValue: {
            getFiscalInfo: jest.fn().mockResolvedValue(null),
            upsertFiscalInfo: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    controller = module.get(TenantFiscalController);
    service = module.get(TenantFiscalService);
  });

  it('delega get e upsert', async () => {
    await controller.getFiscalInfo();
    await controller.upsertFiscalInfo({} as never);
    expect(service.getFiscalInfo).toHaveBeenCalled();
    expect(service.upsertFiscalInfo).toHaveBeenCalled();
  });
});
