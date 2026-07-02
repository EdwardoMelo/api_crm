import { Test, TestingModule } from '@nestjs/testing';
import { BudgetStatus } from '@prisma/client';
import { ActorContextService } from '../../../common/audit';
import { BusinessRuleException, EntityNotFoundException } from '../../../common/exceptions';
import { TenantContextService } from '../../../common/tenant';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailTemplateService } from '../../email-template/service/EmailTemplateService';
import { EmailService } from '../../email/service/EmailService';
import { FILE_STORAGE } from '../../storage/storage.interface';
import { TenantFiscalService } from '../../tenant-fiscal/service/TenantFiscalService';
import { BudgetRepository } from '../repository/BudgetRepository';
import { BudgetEmailService } from './BudgetEmailService';
import { BudgetFileService } from './BudgetFileService';

const budget = {
  id: 1,
  titulo: 'Orçamento site',
  descricao: 'desc',
  valor: 1500,
  dataValidade: new Date('2026-12-31'),
  status: BudgetStatus.RASCUNHO,
  cliente: {
    nome: 'Cliente',
    email: 'cliente@x.com',
    telefone: '11999',
    empresa: 'X',
    documento: '123',
  },
};

const storedFile = {
  buffer: Buffer.from('pdf'),
  fileName: 'orcamento.pdf',
  mimeType: 'application/pdf',
  storagePath: 'path/x.pdf',
};

describe('BudgetEmailService', () => {
  let service: BudgetEmailService;
  let budgetRepo: jest.Mocked<BudgetRepository>;
  let fileService: jest.Mocked<BudgetFileService>;
  let templateService: jest.Mocked<EmailTemplateService>;
  let emailService: jest.Mocked<EmailService>;
  let fiscalService: jest.Mocked<TenantFiscalService>;
  let storage: { getSignedUrl: jest.Mock };
  let prisma: { tenants: { findUnique: jest.Mock } };

  beforeEach(async () => {
    storage = { getSignedUrl: jest.fn().mockResolvedValue('http://link') };
    prisma = { tenants: { findUnique: jest.fn().mockResolvedValue({ nome: 'Empresa' }) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetEmailService,
        {
          provide: BudgetRepository,
          useValue: { findByIdWithClient: jest.fn(), update: jest.fn() },
        },
        {
          provide: BudgetFileService,
          useValue: { getFile: jest.fn(), uploadFile: jest.fn(), getFileBuffer: jest.fn() },
        },
        {
          provide: EmailTemplateService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            previewFromBody: jest.fn().mockResolvedValue({ assunto: 'a', corpo: 'c' }),
            resolveTemplateText: jest.fn().mockReturnValue({ assunto: 'Assunto', corpo: 'Corpo' }),
          },
        },
        { provide: EmailService, useValue: { sendCustomEmail: jest.fn() } },
        {
          provide: TenantFiscalService,
          useValue: { getFiscalInfo: jest.fn().mockResolvedValue(null) },
        },
        { provide: TenantContextService, useValue: { getTenantId: () => 1 } },
        {
          provide: ActorContextService,
          useValue: {
            getActorNome: () => 'Usuario',
            getActorEmail: () => 'user@x.com',
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: 'ConfigService', useValue: {} },
        { provide: require('@nestjs/config').ConfigService, useValue: { get: () => 'from@x.com' } },
        { provide: FILE_STORAGE, useValue: storage },
      ],
    }).compile();

    service = module.get(BudgetEmailService);
    budgetRepo = module.get(BudgetRepository);
    fileService = module.get(BudgetFileService);
    templateService = module.get(EmailTemplateService);
    emailService = module.get(EmailService);
    fiscalService = module.get(TenantFiscalService);
  });

  it('getEmailContext monta o contexto', async () => {
    budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
    fileService.getFile.mockResolvedValue(null);

    const result = await service.getEmailContext(1);
    expect(result.assuntoSugerido).toContain('Orçamento site');
    expect(result.destinatario).toBe('cliente@x.com');
  });

  it('getEmailContext usa dados fiscais quando presentes', async () => {
    budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
    fileService.getFile.mockResolvedValue(null);
    fiscalService.getFiscalInfo.mockResolvedValue({
      razaoSocial: 'RS',
      nomeFantasia: 'NF',
      cnpj: '123',
      emailFiscal: 'fiscal@x.com',
      telefone: '11',
      logradouro: 'Rua',
      numero: '1',
      cidade: 'SP',
      uf: 'SP',
      cep: '00000',
    } as never);

    const result = await service.getEmailContext(1);
    expect(result.empresa.cnpj).toBe('123');
  });

  it('previewTemplate delega para o templateService', async () => {
    budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
    fileService.getFile.mockResolvedValue({ downloadUrl: 'http://d' } as never);
    const result = await service.previewTemplate(1, { assunto: 'a', corpo: 'c' } as never);
    expect(result).toEqual({ assunto: 'a', corpo: 'c' });
  });

  it('buildVariableContext lanca quando orcamento nao existe', async () => {
    budgetRepo.findByIdWithClient.mockResolvedValue(null);
    await expect(service.getEmailContext(1)).rejects.toBeInstanceOf(EntityNotFoundException);
  });

  describe('sendEmail', () => {
    it('lanca quando orcamento nao existe', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue(null);
      await expect(service.sendEmail(1, {} as never)).rejects.toBeInstanceOf(
        EntityNotFoundException,
      );
    });

    it('bloqueia status invalido', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue({
        ...budget,
        status: BudgetStatus.CANCELADO,
      } as never);
      await expect(service.sendEmail(1, {} as never)).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('exige e-mail do cliente', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue({
        ...budget,
        cliente: { ...budget.cliente, email: '' },
      } as never);
      await expect(service.sendEmail(1, {} as never)).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('exige PDF anexado', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
      fileService.getFileBuffer.mockResolvedValue(null);
      await expect(service.sendEmail(1, {} as never)).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('envia com anexo e marca como ENVIADO', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
      fileService.getFileBuffer.mockResolvedValue(storedFile as never);
      emailService.sendCustomEmail.mockResolvedValue({ id: 77 } as never);

      const result = await service.sendEmail(1, { templateId: 2 } as never);

      expect(result.emailLogId).toBe(77);
      expect(result.modoAnexo).toBe('ANEXO');
      expect(budgetRepo.update).toHaveBeenCalledWith(1, { status: BudgetStatus.ENVIADO });
    });

    it('faz upload quando arquivo enviado e usa fallback de link', async () => {
      budgetRepo.findByIdWithClient.mockResolvedValue(budget as never);
      fileService.uploadFile.mockResolvedValue({} as never);
      fileService.getFileBuffer.mockResolvedValue(storedFile as never);
      emailService.sendCustomEmail
        .mockRejectedValueOnce(new Error('anexo grande'))
        .mockResolvedValueOnce({ id: 88 } as never);

      const result = await service.sendEmail(
        1,
        { templateId: 2 } as never,
        { originalname: 'f.pdf' } as never,
      );

      expect(fileService.uploadFile).toHaveBeenCalled();
      expect(result.modoAnexo).toBe('LINK');
      expect(result.emailLogId).toBe(88);
    });
  });
});
