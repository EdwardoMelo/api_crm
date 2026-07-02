import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions';
import { GeminiService } from '../../google-ai/service/GeminiService';
import { EMAIL_TEMPLATE_TONE_PROMPTS } from '../constants/email-template-tone.constants';
import {
  EMAIL_TEMPLATE_SUGGESTION_CONTEXT_RULES,
  EMAIL_TEMPLATE_SUGGESTION_EXAMPLES,
  EMAIL_TEMPLATE_SUGGESTION_IMPROVE_RULES,
  EMAIL_TEMPLATE_SUGGESTION_QUALITY_RULES,
  EMAIL_TEMPLATE_SUGGESTION_SYSTEM_PROMPT,
  EMAIL_TEMPLATE_SUGGESTION_VARIABLE_USAGE_RULES,
  EMAIL_TEMPLATE_VARIABLE_ROLE_LABELS,
} from '../constants/email-template-suggestion-prompt.constants';
import {
  EMAIL_TEMPLATE_VARIABLE_KEYS,
  EmailTemplateVariableKey,
} from '../constants/email-template-variables.constants';
import { SuggestEmailTemplateDTORequest } from '../dto/request/SuggestEmailTemplateDTORequest';
import { SuggestEmailTemplateDTOResponse } from '../dto/response/SuggestEmailTemplateDTOResponse';
import { extractEmailTemplatePlaceholderKeys } from '../utils/email-template.utils';

interface TemplateSuggestionResult {
  assunto?: string;
  corpo?: string;
}

@Injectable()
export class EmailTemplateSuggestionService {
  constructor(private readonly gemini: GeminiService) {}

  async suggest(dto: SuggestEmailTemplateDTORequest): Promise<SuggestEmailTemplateDTOResponse> {
    this.validateModeFields(dto);
    const allowedKeys = this.validateVariableKeys(dto);
    const userPrompt =
      dto.mode === 'improve' ? this.buildImprovePrompt(dto) : this.buildGeneratePrompt(dto);

    let result = await this.requestSuggestion(userPrompt);

    if (!this.isValidResult(result)) {
      result = await this.requestSuggestion(
        `${userPrompt}\n\nIMPORTANTE: Responda APENAS com JSON válido, sem texto adicional.`,
      );
    }

    if (!this.isValidResult(result)) {
      throw new BusinessRuleException('A IA não gerou um template válido. Tente novamente.');
    }

    const assunto = result.assunto!.trim();
    const corpo = result.corpo!.trim();
    this.validatePlaceholders(assunto, corpo, allowedKeys);

    const variaveis = [
      ...new Set([
        ...extractEmailTemplatePlaceholderKeys(assunto),
        ...extractEmailTemplatePlaceholderKeys(corpo),
      ]),
    ].filter((key) => allowedKeys.includes(key as EmailTemplateVariableKey));

    return SuggestEmailTemplateDTOResponse.build({ assunto, corpo, variaveis });
  }

  private validateModeFields(dto: SuggestEmailTemplateDTORequest): void {
    if (dto.mode === 'improve') {
      const hasAssunto = Boolean(dto.assuntoDraft?.trim());
      const hasCorpo = Boolean(dto.corpoDraft?.trim());
      if (!hasAssunto && !hasCorpo) {
        throw new BusinessRuleException(
          'Informe um rascunho no assunto ou no corpo para melhorar o template.',
        );
      }
    }
  }

  private validateVariableKeys(dto: SuggestEmailTemplateDTORequest): EmailTemplateVariableKey[] {
    const keys: EmailTemplateVariableKey[] = [];

    for (const variable of dto.variables) {
      if (!EMAIL_TEMPLATE_VARIABLE_KEYS.includes(variable.key as EmailTemplateVariableKey)) {
        throw new BusinessRuleException(`Variável inválida: ${variable.key}`);
      }
      keys.push(variable.key as EmailTemplateVariableKey);
    }

    return keys;
  }

  private buildGeneratePrompt(dto: SuggestEmailTemplateDTORequest): string {
    const toneDescription = EMAIL_TEMPLATE_TONE_PROMPTS[dto.tone];
    const variableList = this.formatVariablesByRole(dto);

    return `${toneDescription}

${EMAIL_TEMPLATE_SUGGESTION_CONTEXT_RULES}

${EMAIL_TEMPLATE_SUGGESTION_VARIABLE_USAGE_RULES}

${EMAIL_TEMPLATE_SUGGESTION_QUALITY_RULES}

${EMAIL_TEMPLATE_SUGGESTION_EXAMPLES}

## Variáveis obrigatórias
Use TODAS abaixo, com o papel correto (remetente, destinatário ou orçamento):
${variableList}`;
  }

  private buildImprovePrompt(dto: SuggestEmailTemplateDTORequest): string {
    const toneDescription = EMAIL_TEMPLATE_TONE_PROMPTS[dto.tone];
    const variableList = this.formatVariablesByRole(dto);
    const assuntoDraft = dto.assuntoDraft?.trim() ?? '';
    const corpoDraft = dto.corpoDraft?.trim() ?? '';

    return `${toneDescription}

${EMAIL_TEMPLATE_SUGGESTION_IMPROVE_RULES}

${EMAIL_TEMPLATE_SUGGESTION_CONTEXT_RULES}

${EMAIL_TEMPLATE_SUGGESTION_VARIABLE_USAGE_RULES}

${EMAIL_TEMPLATE_SUGGESTION_QUALITY_RULES}

${EMAIL_TEMPLATE_SUGGESTION_EXAMPLES}

## Rascunho atual do usuário
Assunto: ${assuntoDraft || '(vazio)'}
Corpo:
${corpoDraft}

## Variáveis permitidas
Use APENAS estas variáveis (inclua as obrigatórias que ainda faltam no rascunho):
${variableList}`;
  }

  private formatVariablesByRole(dto: SuggestEmailTemplateDTORequest): string {
    const byDomain = new Map<string, typeof dto.variables>();

    for (const variable of dto.variables) {
      const domain = variable.key.split('.')[0] ?? 'outros';
      const list = byDomain.get(domain) ?? [];
      list.push(variable);
      byDomain.set(domain, list);
    }

    const domainOrder = ['cliente', 'orcamento', 'empresa', 'usuario'];

    return domainOrder
      .filter((domain) => byDomain.has(domain))
      .map((domain) => {
        const roleLabel = EMAIL_TEMPLATE_VARIABLE_ROLE_LABELS[domain] ?? domain;
        const vars = byDomain
          .get(domain)!
          .map((v) => `  - {{${v.key}}} — ${v.label}`)
          .join('\n');
        return `### ${roleLabel}\n${vars}`;
      })
      .join('\n\n');
  }

  private async requestSuggestion(userPrompt: string): Promise<TemplateSuggestionResult> {
    try {
      return await this.gemini.generateJson<TemplateSuggestionResult>(
        EMAIL_TEMPLATE_SUGGESTION_SYSTEM_PROMPT,
        userPrompt,
      );
    } catch (error) {
      if (error instanceof BusinessRuleException) {
        throw error;
      }
      throw new BusinessRuleException('A IA não gerou um template válido. Tente novamente.');
    }
  }

  private isValidResult(result: TemplateSuggestionResult): boolean {
    return Boolean(result.assunto?.trim() && result.corpo?.trim());
  }

  private validatePlaceholders(
    assunto: string,
    corpo: string,
    allowedKeys: EmailTemplateVariableKey[],
  ): void {
    const usedKeys = [
      ...extractEmailTemplatePlaceholderKeys(assunto),
      ...extractEmailTemplatePlaceholderKeys(corpo),
    ];

    const unknownKeys = usedKeys.filter(
      (key) => !allowedKeys.includes(key as EmailTemplateVariableKey),
    );

    if (unknownKeys.length > 0) {
      throw new BusinessRuleException(
        `A IA usou variáveis não permitidas: ${unknownKeys.join(', ')}. Tente novamente.`,
      );
    }
  }
}
