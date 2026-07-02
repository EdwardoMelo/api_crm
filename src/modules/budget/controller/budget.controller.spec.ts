import { Test, TestingModule } from '@nestjs/testing';
import { BudgetEmailService } from '../service/BudgetEmailService';
import { BudgetFileService } from '../service/BudgetFileService';
import { BudgetService } from '../service/BudgetService';
import { BudgetController } from './BudgetController';

describe('BudgetController', () => {
  let controller: BudgetController;
  let budgetService: jest.Mocked<BudgetService>;
  let fileService: jest.Mocked<BudgetFileService>;
  let emailService: jest.Mocked<BudgetEmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: BudgetService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            convertToProject: jest.fn().mockResolvedValue({ id: 2 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: BudgetFileService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({ id: 1 }),
            getFile: jest.fn().mockResolvedValue(null),
            deleteFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: BudgetEmailService,
          useValue: {
            getEmailContext: jest.fn().mockResolvedValue({ assuntoSugerido: 'x' }),
            previewTemplate: jest.fn().mockResolvedValue({ assunto: 'a', corpo: 'c' }),
            sendEmail: jest.fn().mockResolvedValue({ emailLogId: 1 }),
          },
        },
      ],
    }).compile();

    controller = module.get(BudgetController);
    budgetService = module.get(BudgetService);
    fileService = module.get(BudgetFileService);
    emailService = module.get(BudgetEmailService);
  });

  it('delega todos os endpoints', async () => {
    await controller.create({} as never);
    await controller.findAll({} as never);
    await controller.getEmailContext(1);
    await controller.previewEmailTemplate(1, {} as never);
    await controller.uploadFile(1, {} as never);
    await controller.getFile(1);
    await controller.deleteFile(1);
    await controller.sendEmail(1, {} as never, {} as never);
    await controller.findById(1);
    await controller.update(1, {} as never);
    await controller.convertToProject(1);
    await controller.remove(1);

    expect(budgetService.create).toHaveBeenCalled();
    expect(fileService.uploadFile).toHaveBeenCalledWith(1, {});
    expect(emailService.sendEmail).toHaveBeenCalled();
    expect(budgetService.convertToProject).toHaveBeenCalledWith(1);
  });
});
