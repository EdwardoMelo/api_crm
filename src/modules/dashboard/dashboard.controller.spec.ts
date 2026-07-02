import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './controller/DashboardController';
import { DashboardService } from './service/DashboardService';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: { getSummary: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    controller = module.get(DashboardController);
    service = module.get(DashboardService);
  });

  it('delega getSummary', async () => {
    await controller.getSummary({} as never);
    expect(service.getSummary).toHaveBeenCalled();
  });
});
