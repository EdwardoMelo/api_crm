import { ConfigService } from '@nestjs/config';
import { BusinessRuleException } from '../../../common/exceptions';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  const actual = jest.requireActual('@google/genai');
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    ...actual,
    ApiError,
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: { generateContent: mockGenerateContent },
    })),
  };
});

import { ApiError as RealApiError } from '@google/genai';
import { GeminiService } from './GeminiService';

const ApiError = RealApiError as unknown as new (status: number, message: string) => Error;

function build(values: Record<string, string | undefined>): GeminiService {
  const config = {
    get: (key: string, def?: string) => values[key] ?? def,
  } as unknown as ConfigService;
  return new GeminiService(config);
}

describe('GeminiService', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it('lanca quando nao ha api key', async () => {
    const service = build({});
    await expect(service.generateJson('sys', 'user')).rejects.toBeInstanceOf(
      BusinessRuleException,
    );
  });

  it('retorna JSON parseado no sucesso', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockResolvedValue({ text: '{"assunto":"a","corpo":"c"}' });
    const result = await service.generateJson<{ assunto: string }>('sys', 'user');
    expect(result.assunto).toBe('a');
  });

  it('lanca quando resposta vazia', async () => {
    const service = build({ GOOGLE_API_KEY: 'k' });
    mockGenerateContent.mockResolvedValue({ text: '   ' });
    await expect(service.generateJson('s', 'u')).rejects.toThrow('resposta válida');
  });

  it('lanca quando JSON invalido', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockResolvedValue({ text: 'not-json' });
    await expect(service.generateJson('s', 'u')).rejects.toThrow('interpretar a resposta');
  });

  it('mapeia ApiError 401/403', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockRejectedValue(new ApiError(401, 'unauth'));
    await expect(service.generateJson('s', 'u')).rejects.toThrow('inválida ou sem permissão');
  });

  it('mapeia ApiError 404', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockRejectedValue(new ApiError(404, 'not found'));
    await expect(service.generateJson('s', 'u')).rejects.toThrow('não encontrado');
  });

  it('mapeia ApiError 429', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockRejectedValue(new ApiError(429, 'quota'));
    await expect(service.generateJson('s', 'u')).rejects.toThrow('Cota');
  });

  it('mapeia erro generico', async () => {
    const service = build({ GEMINI_API_KEY: 'k' });
    mockGenerateContent.mockRejectedValue(new Error('boom'));
    await expect(service.generateJson('s', 'u')).rejects.toThrow('conectar ao Google Gemini');
  });
});
