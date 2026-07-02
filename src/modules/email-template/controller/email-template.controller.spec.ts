import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from '../service/EmailTemplateService';
import { EmailTemplateSuggestionService } from '../service/EmailTemplateSuggestionService';
import { EmailTemplateController } from './EmailTemplateController';

describe('EmailTemplateController', () => {
  let controller: EmailTemplateController;
  let templateService: jest.Mocked<EmailTemplateService>;
  let suggestionService: jest.Mocked<EmailTemplateSuggestionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailTemplateController],
      providers: [
        {
          provide: EmailTemplateService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            create: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn().mockResolvedValue({ id: 1 }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailTemplateSuggestionService,
          useValue: { suggest: jest.fn().mockResolvedValue({ assunto: 'a', corpo: 'c' }) },
        },
      ],
    }).compile();

    controller = module.get(EmailTemplateController);
    templateService = module.get(EmailTemplateService);
    suggestionService = module.get(EmailTemplateSuggestionService);
  });

  it('listVariables retorna chaves e labels', () => {
    const result = controller.listVariables();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('key');
    expect(result[0]).toHaveProperty('label');
  });

  it('delega os demais endpoints', async () => {
    await controller.findAll();
    await controller.suggest({} as never);
    await controller.findById(1);
    await controller.create({} as never);
    await controller.update(1, {} as never);
    await controller.remove(1);

    expect(templateService.findAll).toHaveBeenCalled();
    expect(suggestionService.suggest).toHaveBeenCalled();
    expect(templateService.remove).toHaveBeenCalledWith(1);
  });
});
