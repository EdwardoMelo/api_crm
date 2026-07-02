import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from '../../../common/exceptions';
import { GeminiService } from '../../google-ai/service/GeminiService';
import { EmailTemplateSuggestionService } from './EmailTemplateSuggestionService';

const variables = [
  { key: 'cliente.nome', label: 'Cliente nome' },
  { key: 'orcamento.titulo', label: 'Orçamento título' },
];

describe('EmailTemplateSuggestionService', () => {
  let service: EmailTemplateSuggestionService;
  let gemini: jest.Mocked<GeminiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateSuggestionService,
        { provide: GeminiService, useValue: { generateJson: jest.fn() } },
      ],
    }).compile();

    service = module.get(EmailTemplateSuggestionService);
    gemini = module.get(GeminiService);
  });

  it('gera template valido (modo generate)', async () => {
    gemini.generateJson.mockResolvedValue({
      assunto: 'Olá {{cliente.nome}}',
      corpo: 'Sobre {{orcamento.titulo}}',
    });

    const result = await service.suggest({
      mode: 'generate',
      tone: 'formal',
      variables,
    } as never);

    expect(result.assunto).toContain('{{cliente.nome}}');
    expect(result.variaveis).toEqual(expect.arrayContaining(['cliente.nome', 'orcamento.titulo']));
  });

  it('melhora template com rascunho (modo improve)', async () => {
    gemini.generateJson.mockResolvedValue({
      assunto: 'Melhorado {{cliente.nome}}',
      corpo: 'Corpo {{orcamento.titulo}}',
    });

    const result = await service.suggest({
      mode: 'improve',
      tone: 'amigavel',
      assuntoDraft: 'rascunho',
      corpoDraft: '',
      variables,
    } as never);

    expect(result.corpo).toContain('{{orcamento.titulo}}');
  });

  it('exige rascunho no modo improve', async () => {
    await expect(
      service.suggest({ mode: 'improve', tone: 'formal', variables } as never),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('rejeita variavel invalida', async () => {
    await expect(
      service.suggest({
        mode: 'generate',
        tone: 'formal',
        variables: [{ key: 'inexistente.campo', label: 'x' }],
      } as never),
    ).rejects.toThrow('Variável inválida');
  });

  it('faz retry quando resultado invalido e falha se continuar invalido', async () => {
    gemini.generateJson.mockResolvedValue({ assunto: '', corpo: '' });
    await expect(
      service.suggest({ mode: 'generate', tone: 'formal', variables } as never),
    ).rejects.toBeInstanceOf(BusinessRuleException);
    expect(gemini.generateJson).toHaveBeenCalledTimes(2);
  });

  it('aceita no retry quando a segunda resposta e valida', async () => {
    gemini.generateJson
      .mockResolvedValueOnce({ assunto: '', corpo: '' })
      .mockResolvedValueOnce({ assunto: 'Oi {{cliente.nome}}', corpo: 'Corpo' });

    const result = await service.suggest({
      mode: 'generate',
      tone: 'formal',
      variables,
    } as never);
    expect(result.assunto).toContain('cliente.nome');
  });

  it('rejeita quando IA usa variaveis nao permitidas', async () => {
    gemini.generateJson.mockResolvedValue({
      assunto: 'Oi {{empresa.cnpj}}',
      corpo: 'Corpo',
    });
    await expect(
      service.suggest({ mode: 'generate', tone: 'formal', variables } as never),
    ).rejects.toThrow('variáveis não permitidas');
  });

  it('converte erro generico do gemini em BusinessRuleException', async () => {
    gemini.generateJson.mockRejectedValue(new Error('network'));
    await expect(
      service.suggest({ mode: 'generate', tone: 'formal', variables } as never),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('propaga BusinessRuleException do gemini', async () => {
    gemini.generateJson.mockRejectedValue(new BusinessRuleException('cota esgotada'));
    await expect(
      service.suggest({ mode: 'generate', tone: 'formal', variables } as never),
    ).rejects.toThrow('cota esgotada');
  });
});
