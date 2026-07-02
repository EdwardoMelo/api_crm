import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './controller/EmailController';
import { EmailService } from './service/EmailService';

describe('EmailController', () => {
  let controller: EmailController;
  let service: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendBudgetEmail: jest.fn().mockResolvedValue({ id: 1 }),
            sendChargeEmail: jest.fn().mockResolvedValue({ id: 2 }),
            findAllLogs: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get(EmailController);
    service = module.get(EmailService);
  });

  it('delega os endpoints de e-mail', async () => {
    await controller.sendBudget({} as never);
    await controller.sendCharge({} as never);
    await controller.findLogs();
    expect(service.sendBudgetEmail).toHaveBeenCalled();
    expect(service.sendChargeEmail).toHaveBeenCalled();
    expect(service.findAllLogs).toHaveBeenCalled();
  });
});
