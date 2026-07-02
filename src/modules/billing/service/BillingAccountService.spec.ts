import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from '../../../common/exceptions';
import { BillingRepository } from '../repository/BillingRepository';
import { AsaasClient } from './AsaasClient';
import { BillingAccountService } from './BillingAccountService';

describe('BillingAccountService', () => {
  let service: BillingAccountService;
  let repository: jest.Mocked<BillingRepository>;
  let asaas: jest.Mocked<AsaasClient>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<BillingRepository>> = {
      findBillingAccountByTenant: jest.fn(),
      findTenantBillingContext: jest.fn(),
      createBillingAccount: jest.fn(),
    };
    const asaasMock: Partial<jest.Mocked<AsaasClient>> = {
      createCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingAccountService,
        { provide: BillingRepository, useValue: repositoryMock },
        { provide: AsaasClient, useValue: asaasMock },
      ],
    }).compile();

    service = module.get(BillingAccountService);
    repository = module.get(BillingRepository);
    asaas = module.get(AsaasClient);
  });

  it('retorna a conta existente sem chamar o Asaas', async () => {
    repository.findBillingAccountByTenant.mockResolvedValue({ id: 1 } as never);
    const result = await service.ensureCustomer(1);
    expect(result).toEqual({ id: 1 });
    expect(asaas.createCustomer).not.toHaveBeenCalled();
  });

  it('lanca BusinessRuleException quando tenant nao encontrado', async () => {
    repository.findBillingAccountByTenant.mockResolvedValue(null);
    repository.findTenantBillingContext.mockResolvedValue(null);
    await expect(service.ensureCustomer(1)).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('cria customer usando dados fiscais', async () => {
    repository.findBillingAccountByTenant.mockResolvedValue(null);
    repository.findTenantBillingContext.mockResolvedValue({
      nome: 'Empresa X',
      tenant_fiscal_info: { cnpj: '12345678000199', emailFiscal: 'fiscal@x.com' },
      users: [{ nome: 'Admin', email: 'admin@x.com' }],
    } as never);
    asaas.createCustomer.mockResolvedValue({ id: 'cus_1' } as never);
    repository.createBillingAccount.mockResolvedValue({ id: 1, asaasCustomerId: 'cus_1' } as never);

    await service.ensureCustomer(1, 'actor');

    expect(asaas.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Empresa X',
        cpfCnpj: '12345678000199',
        email: 'fiscal@x.com',
        externalReference: 'tenant:1',
      }),
    );
    expect(repository.createBillingAccount).toHaveBeenCalled();
  });

  it('usa CPF sandbox e email do admin como fallback', async () => {
    repository.findBillingAccountByTenant.mockResolvedValue(null);
    repository.findTenantBillingContext.mockResolvedValue({
      nome: 'Empresa Y',
      tenant_fiscal_info: null,
      users: [{ nome: 'Admin', email: 'admin@y.com' }],
    } as never);
    asaas.createCustomer.mockResolvedValue({ id: 'cus_2' } as never);
    repository.createBillingAccount.mockResolvedValue({ id: 2 } as never);

    await service.ensureCustomer(2);

    expect(asaas.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@y.com' }),
    );
  });
});
