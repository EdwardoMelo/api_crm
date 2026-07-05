import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { ActorContextService } from '../../../common/audit';
import { BusinessRuleException } from '../../../common/exceptions';
import { TenantContextService } from '../../../common/tenant';
import { TenantFiscalService } from '../../tenant-fiscal/service/TenantFiscalService';
import { FILE_STORAGE } from '../../storage/storage.interface';
import { EMAIL_CAMPAIGN_CLIENT } from '../constants/email-campaign.constants';
import { EmailCampaignRepository } from '../repository/EmailCampaignRepository';
import { EmailCampaignService } from './EmailCampaignService';

describe('EmailCampaignService', () => {
  let service: EmailCampaignService;
  let repository: jest.Mocked<Partial<EmailCampaignRepository>>;
  let client: { emit: jest.Mock };
  let storage: { upload: jest.Mock };

  beforeEach(async () => {
    repository = {
      getTenantName: jest.fn().mockResolvedValue('Minha Empresa'),
      findClientsByIds: jest.fn(),
      findLeadsByIds: jest.fn(),
      createCampaign: jest.fn().mockResolvedValue({ id: 10, status: 'PROCESSANDO' }),
      setCampaignAttachment: jest.fn().mockResolvedValue(undefined),
      createQueuedEmails: jest.fn().mockResolvedValue(undefined),
      findQueuedByCampaign: jest.fn(),
    };
    client = { emit: jest.fn().mockReturnValue(of(undefined)) };
    storage = { upload: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailCampaignService,
        { provide: EmailCampaignRepository, useValue: repository },
        { provide: TenantFiscalService, useValue: { getFiscalInfo: jest.fn().mockResolvedValue(null) } },
        { provide: TenantContextService, useValue: { getTenantId: jest.fn().mockReturnValue(1) } },
        {
          provide: ActorContextService,
          useValue: {
            getActorId: jest.fn().mockReturnValue('5'),
            getActorNome: jest.fn().mockReturnValue('Maria'),
            getActorEmail: jest.fn().mockReturnValue('maria@empresa.com'),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('from@empresa.com') } },
        { provide: FILE_STORAGE, useValue: storage },
        { provide: EMAIL_CAMPAIGN_CLIENT, useValue: client },
      ],
    }).compile();

    service = module.get(EmailCampaignService);
  });

  it('cria a campanha, resolve variáveis por destinatário e publica uma mensagem por envio', async () => {
    (repository.findClientsByIds as jest.Mock).mockResolvedValue([
      { id: 1, nome: 'João', email: 'joao@x.com', telefone: null, empresa: null, documento: null },
      { id: 2, nome: 'Ana', email: 'ana@x.com', telefone: null, empresa: null, documento: null },
    ]);
    (repository.findQueuedByCampaign as jest.Mock).mockResolvedValue([
      { id: 100, destinatario: 'joao@x.com', assunto: 'Olá João', corpo: '<p>Oi</p>' },
      { id: 101, destinatario: 'ana@x.com', assunto: 'Olá Ana', corpo: '<p>Oi</p>' },
    ]);

    const result = await service.create({
      recipientType: 'CLIENT',
      recipientIds: [1, 2],
      assunto: 'Olá {{cliente.nome}}',
      corpo: 'Mensagem para {{cliente.nome}}',
    });

    expect(repository.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ totalDestinatarios: 2, totalIgnorados: 0 }),
    );
    expect(repository.createQueuedEmails).toHaveBeenCalledWith(
      10,
      expect.arrayContaining([expect.objectContaining({ assunto: 'Olá João' })]),
    );
    expect(client.emit).toHaveBeenCalledTimes(2);
    expect(result.campaignId).toBe(10);
    expect(result.totalDestinatarios).toBe(2);
  });

  it('ignora leads sem e-mail e contabiliza em totalIgnorados', async () => {
    (repository.findLeadsByIds as jest.Mock).mockResolvedValue([
      { id: 1, nome: 'Com Email', email: 'lead@x.com', telefone: null, empresa: null, documento: null },
      { id: 2, nome: 'Sem Email', email: null, telefone: null, empresa: null, documento: null },
    ]);
    (repository.findQueuedByCampaign as jest.Mock).mockResolvedValue([
      { id: 200, destinatario: 'lead@x.com', assunto: 'Oi', corpo: '<p>x</p>' },
    ]);

    const result = await service.create({
      recipientType: 'LEAD',
      recipientIds: [1, 2],
      assunto: 'Oi',
      corpo: 'Corpo',
    });

    expect(result.totalDestinatarios).toBe(1);
    expect(result.totalIgnorados).toBe(1);
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it('publica em lotes respeitando EMAIL_CAMPAIGN_PUBLISH_BATCH_SIZE (um emit por envio)', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'EMAIL_CAMPAIGN_PUBLISH_BATCH_SIZE') return '2';
        if (key === 'EMAIL_CAMPAIGN_PUBLISH_BATCH_DELAY_MS') return '0';
        return 'from@empresa.com';
      }),
    };
    const batchClient = { emit: jest.fn().mockReturnValue(of(undefined)) };
    const batchRepo: jest.Mocked<Partial<EmailCampaignRepository>> = {
      getTenantName: jest.fn().mockResolvedValue('Minha Empresa'),
      findClientsByIds: jest.fn().mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          nome: `Cliente ${i + 1}`,
          email: `c${i + 1}@x.com`,
          telefone: null,
          empresa: null,
          documento: null,
        })),
      ),
      createCampaign: jest.fn().mockResolvedValue({ id: 20, status: 'PROCESSANDO' }),
      createQueuedEmails: jest.fn().mockResolvedValue(undefined),
      findQueuedByCampaign: jest.fn().mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: 300 + i,
          destinatario: `c${i + 1}@x.com`,
          assunto: 'Oi',
          corpo: '<p>x</p>',
        })),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailCampaignService,
        { provide: EmailCampaignRepository, useValue: batchRepo },
        { provide: TenantFiscalService, useValue: { getFiscalInfo: jest.fn().mockResolvedValue(null) } },
        { provide: TenantContextService, useValue: { getTenantId: jest.fn().mockReturnValue(1) } },
        {
          provide: ActorContextService,
          useValue: {
            getActorId: jest.fn().mockReturnValue('5'),
            getActorNome: jest.fn().mockReturnValue('Maria'),
            getActorEmail: jest.fn().mockReturnValue('maria@empresa.com'),
          },
        },
        { provide: ConfigService, useValue: config },
        { provide: FILE_STORAGE, useValue: storage },
        { provide: EMAIL_CAMPAIGN_CLIENT, useValue: batchClient },
      ],
    }).compile();

    const batchService = module.get(EmailCampaignService);

    const result = await batchService.create({
      recipientType: 'CLIENT',
      recipientIds: [1, 2, 3, 4, 5],
      assunto: 'Oi',
      corpo: 'Corpo',
    });

    // 5 destinatários / lote de 2 => 3 lotes, mas sempre 1 emit por envio.
    expect(batchClient.emit).toHaveBeenCalledTimes(5);
    expect(result.totalDestinatarios).toBe(5);
  });

  it('lança BusinessRuleException quando nenhum destinatário tem e-mail', async () => {
    (repository.findClientsByIds as jest.Mock).mockResolvedValue([
      { id: 1, nome: 'Sem Email', email: null, telefone: null, empresa: null, documento: null },
    ]);

    await expect(
      service.create({ recipientType: 'CLIENT', recipientIds: [1], assunto: 'a', corpo: 'b' }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
    expect(repository.createCampaign).not.toHaveBeenCalled();
  });
});
