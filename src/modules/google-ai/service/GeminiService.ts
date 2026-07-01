import { ApiError, GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessRuleException } from '../../../common/exceptions';
import { EMAIL_TEMPLATE_SUGGESTION_JSON_SCHEMA } from '../constants/gemini-response.schema';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI | null;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const apiKey =
      this.config.get<string>('GEMINI_API_KEY')?.trim() ||
      this.config.get<string>('GOOGLE_API_KEY')?.trim();
    this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    this.timeoutMs = Number(this.config.get<string>('GEMINI_TIMEOUT_MS', '90000'));
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async generateJson<T>(system: string, user: string): Promise<T> {
    if (!this.client) {
      throw new BusinessRuleException(
        'GEMINI_API_KEY não configurada. Adicione a chave do Google AI Studio no .env.',
      );
    }

    try {
      const response = await Promise.race([
        this.client.models.generateContent({
          model: this.model,
          contents: user,
          config: {
            systemInstruction: system,
            responseMimeType: 'application/json',
            responseJsonSchema: EMAIL_TEMPLATE_SUGGESTION_JSON_SCHEMA,
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), this.timeoutMs);
        }),
      ]);

      const content = response.text?.trim();
      if (!content) {
        throw new BusinessRuleException('O modelo não retornou uma resposta válida.');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof BusinessRuleException) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new BusinessRuleException(
          'Não foi possível interpretar a resposta da IA. Tente novamente.',
        );
      }
      if (error instanceof Error && error.message === 'GEMINI_TIMEOUT') {
        throw new BusinessRuleException(
          'A IA demorou demais para responder. Tente novamente.',
        );
      }
      throw new BusinessRuleException(this.mapGeminiError(error));
    }
  }

  private mapGeminiError(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return 'Chave de API do Google Gemini inválida ou sem permissão. Verifique no AI Studio.';
      }
      if (error.status === 404) {
        return `Modelo "${this.model}" não encontrado. Verifique GEMINI_MODEL no .env.`;
      }
      if (error.status === 429) {
        return 'Cota ou créditos do Google Gemini esgotados. Verifique faturamento no AI Studio.';
      }
      if (error.message) {
        return error.message;
      }
    }
    return 'Não foi possível conectar ao Google Gemini. Tente novamente.';
  }
}
