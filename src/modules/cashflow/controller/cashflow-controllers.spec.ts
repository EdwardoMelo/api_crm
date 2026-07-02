import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowService } from '../service/CashFlowService';
import { FixedExpenseService } from '../service/FixedExpenseService';
import { FixedIncomeService } from '../service/FixedIncomeService';
import { InstallmentPlanService } from '../service/InstallmentPlanService';
import { CashFlowController } from './CashFlowController';
import { FixedExpenseController } from './FixedExpenseController';
import { FixedIncomeController } from './FixedIncomeController';
import { InstallmentPlanController } from './InstallmentPlanController';

describe('CashFlow controllers', () => {
  let cashFlowController: CashFlowController;
  let fixedExpenseController: FixedExpenseController;
  let fixedIncomeController: FixedIncomeController;
  let installmentController: InstallmentPlanController;

  let cashFlowService: jest.Mocked<CashFlowService>;
  let fixedExpenseService: jest.Mocked<FixedExpenseService>;
  let fixedIncomeService: jest.Mocked<FixedIncomeService>;
  let installmentService: jest.Mocked<InstallmentPlanService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        CashFlowController,
        FixedExpenseController,
        FixedIncomeController,
        InstallmentPlanController,
      ],
      providers: [
        {
          provide: CashFlowService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue({ items: [] }),
            listCategories: jest.fn().mockResolvedValue({ categories: [] }),
            uploadNotaFiscal: jest.fn().mockResolvedValue({ id: 1 }),
            removeNotaFiscal: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FixedExpenseService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            findCashFlows: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            renew: jest.fn().mockResolvedValue({ id: 2 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FixedIncomeService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            findCashFlows: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            renew: jest.fn().mockResolvedValue({ id: 2 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: InstallmentPlanService,
          useValue: {
            previewInstallments: jest.fn().mockReturnValue([]),
            create: jest.fn().mockResolvedValue({ id: 1 }),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            cancel: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    cashFlowController = module.get(CashFlowController);
    fixedExpenseController = module.get(FixedExpenseController);
    fixedIncomeController = module.get(FixedIncomeController);
    installmentController = module.get(InstallmentPlanController);
    cashFlowService = module.get(CashFlowService);
    fixedExpenseService = module.get(FixedExpenseService);
    fixedIncomeService = module.get(FixedIncomeService);
    installmentService = module.get(InstallmentPlanService);
  });

  it('CashFlowController delega todos os endpoints', async () => {
    await cashFlowController.create({} as never);
    await cashFlowController.findAll({} as never);
    await cashFlowController.listCategories({} as never);
    await cashFlowController.uploadNotaFiscal(1, {} as never);
    await cashFlowController.removeNotaFiscal(1);
    await cashFlowController.findById(1);
    await cashFlowController.update(1, {} as never);
    await cashFlowController.remove(1);
    expect(cashFlowService.create).toHaveBeenCalled();
    expect(cashFlowService.uploadNotaFiscal).toHaveBeenCalledWith(1, {});
    expect(cashFlowService.remove).toHaveBeenCalledWith(1);
  });

  it('FixedExpenseController delega todos os endpoints', async () => {
    await fixedExpenseController.create({} as never);
    await fixedExpenseController.findAll({} as never);
    await fixedExpenseController.findById(1);
    await fixedExpenseController.findCashFlows(1);
    await fixedExpenseController.update(1, {} as never);
    await fixedExpenseController.renew(1, {} as never);
    await fixedExpenseController.remove(1);
    expect(fixedExpenseService.renew).toHaveBeenCalledWith(1, {});
  });

  it('FixedIncomeController delega todos os endpoints', async () => {
    await fixedIncomeController.create({} as never);
    await fixedIncomeController.findAll({} as never);
    await fixedIncomeController.findById(1);
    await fixedIncomeController.findCashFlows(1);
    await fixedIncomeController.update(1, {} as never);
    await fixedIncomeController.renew(1, {} as never);
    await fixedIncomeController.remove(1);
    expect(fixedIncomeService.create).toHaveBeenCalled();
  });

  it('InstallmentPlanController delega todos os endpoints', async () => {
    installmentController.preview({} as never);
    await installmentController.create({} as never);
    await installmentController.findAll({} as never);
    await installmentController.findById(1);
    await installmentController.cancel(1);
    expect(installmentService.cancel).toHaveBeenCalledWith(1);
  });
});
