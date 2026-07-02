import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './controller/AdminController';
import { AdminService } from './service/AdminService';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            listTenants: jest.fn().mockResolvedValue([]),
            getDashboard: jest.fn().mockResolvedValue({ totalTenants: 0 }),
          },
        },
      ],
    }).compile();

    controller = module.get(AdminController);
    service = module.get(AdminService);
  });

  it('delega listTenants e getDashboard', async () => {
    await controller.listTenants({} as never);
    await controller.getDashboard();
    expect(service.listTenants).toHaveBeenCalled();
    expect(service.getDashboard).toHaveBeenCalled();
  });
});
