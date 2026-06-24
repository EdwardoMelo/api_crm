import {
  EMAIL_TEMPLATE_VARIABLE_KEYS,
  EmailTemplateVariableKey,
} from '../constants/email-template-variables.constants';
import { EmailTemplateVariableContext } from '../types/variable-context.types';

export interface EmailTemplatePreview {
  assunto: string;
  corpo: string;
  variaveis: EmailTemplateVariableKey[];
}

function formatCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatDocumento(documento: string | null | undefined): string | null {
  if (!documento) return null;
  const digits = documento.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return formatCnpj(digits);
  }
  return documento;
}

export function formatCurrency(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('pt-BR');
}

export function buildEmailTemplateVariableMap(
  context: EmailTemplateVariableContext,
  linkArquivo?: string | null,
): Map<EmailTemplateVariableKey, string[]> {
  const map = new Map<EmailTemplateVariableKey, string[]>();
  const push = (key: EmailTemplateVariableKey, ...values: Array<string | null | undefined>) => {
    const filtered = values
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());
    if (filtered.length > 0) {
      map.set(key, [...new Set(filtered)]);
    }
  };

  push('empresa.nome', context.empresa.nome);
  push('empresa.razaoSocial', context.empresa.razaoSocial);
  push('empresa.nomeFantasia', context.empresa.nomeFantasia);
  push('empresa.cnpj', context.empresa.cnpj, formatCnpj(context.empresa.cnpj));
  push('empresa.email', context.empresa.email);
  push('empresa.telefone', context.empresa.telefone);
  push('empresa.endereco', context.empresa.endereco);
  push('cliente.nome', context.cliente.nome);
  push('cliente.email', context.cliente.email);
  push('cliente.telefone', context.cliente.telefone);
  push('cliente.empresa', context.cliente.empresa);
  push(
    'cliente.documento',
    context.cliente.documento,
    formatDocumento(context.cliente.documento),
  );
  push('orcamento.titulo', context.orcamento.titulo);
  push('orcamento.valor', String(context.orcamento.valor));
  push('orcamento.valorFormatado', context.orcamento.valorFormatado);
  push('orcamento.descricao', context.orcamento.descricao);
  push('orcamento.validade', context.orcamento.validade);
  push('orcamento.validadeFormatada', context.orcamento.validadeFormatada);
  push('orcamento.linkArquivo', linkArquivo);
  push('usuario.nome', context.usuario.nome);
  push('usuario.email', context.usuario.email);

  return map;
}

const PLACEHOLDER_PATTERN = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

export function resolveEmailTemplate(
  text: string,
  context: EmailTemplateVariableContext,
  linkArquivo?: string | null,
): string {
  const variableMap = buildEmailTemplateVariableMap(context, linkArquivo);
  return text.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    if (!EMAIL_TEMPLATE_VARIABLE_KEYS.includes(key as EmailTemplateVariableKey)) {
      return match;
    }
    const values = variableMap.get(key as EmailTemplateVariableKey);
    return values?.[0] ?? match;
  });
}

export function detectEmailTemplateVariables(
  assunto: string,
  corpo: string,
  context: EmailTemplateVariableContext,
  linkArquivo?: string | null,
): EmailTemplatePreview {
  const variableMap = buildEmailTemplateVariableMap(context, linkArquivo);
  const entries = [...variableMap.entries()]
    .flatMap(([key, values]) => values.map((value) => ({ key, value })))
    .filter((entry) => entry.value.length >= 2)
    .sort((a, b) => b.value.length - a.value.length);

  const usedKeys = new Set<EmailTemplateVariableKey>();
  let previewAssunto = assunto;
  let previewCorpo = corpo;

  for (const { key, value } of entries) {
    if (previewAssunto.includes(value) || previewCorpo.includes(value)) {
      previewAssunto = previewAssunto.split(value).join(`{{${key}}}`);
      previewCorpo = previewCorpo.split(value).join(`{{${key}}}`);
      usedKeys.add(key);
    }
  }

  return {
    assunto: previewAssunto,
    corpo: previewCorpo,
    variaveis: [...usedKeys],
  };
}

export function plainTextToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim() || '&nbsp;')
    .join('<br>');
}
