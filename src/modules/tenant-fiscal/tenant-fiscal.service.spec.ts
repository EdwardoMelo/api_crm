import { Test, TestingModule } from '@nestjs/testing';
import { tenant_fiscal_info, tenant_fiscal_info_regimeTributario } from '@prisma/client';
import { TenantFiscalRepository } from './repository/TenantFiscalRepository';
import { TenantFiscalService } from './service/TenantFiscalService';

const buildFiscalInfo = (): tenant_fiscal_info => ({
  id: 1,
  tenantId: 1,
  razaoSocial: 'Empresa Demo LTDA',
  nomeFantasia: 'Empresa Demo',
  cnpj: '12345678000199',
  inscricaoEstadual: '123456789',
  inscricaoMunicipal: '987654',
  regimeTributario: tenant_fiscal_info_regimeTributario.SIMPLES_NACIONAL,
  cnaePrincipal: '6201501',
  emailFiscal: 'fiscal@empresa.com',
  telefone: '11999999999',
  logradouro: 'Rua Exemplo',
  numero: '100',
  complemento: null,
  bairro: 'Centro',
  cep: '01310100',
  cidade: 'São Paulo',
  uf: 'SP',
  codigoIbgeMunicipio: '3550308',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

describe('TenantFiscalService', () => {
  let service: TenantFiscalService;
  let repository: jest.Mocked<TenantFiscalRepository>;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<TenantFiscalRepository>> = {
      findByTenantId: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantFiscalService,
        { provide: TenantFiscalRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(TenantFiscalService);
    repository = module.get(TenantFiscalRepository);
  });

  it('getFiscalInfo retorna null quando não cadastrado', async () => {
    repository.findByTenantId.mockResolvedValue(null);
    await expect(service.getFiscalInfo()).resolves.toBeNull();
  });

  it('upsertFiscalInfo persiste dados fiscais', async () => {
    repository.upsert.mockResolvedValue(buildFiscalInfo());

    const result = await service.upsertFiscalInfo({
      razaoSocial: 'Empresa Demo LTDA',
      cnpj: '12345678000199',
      regimeTributario: tenant_fiscal_info_regimeTributario.SIMPLES_NACIONAL,
    });

    expect(result.cnpj).toBe('12345678000199');
    expect(repository.upsert).toHaveBeenCalled();
  });
});
