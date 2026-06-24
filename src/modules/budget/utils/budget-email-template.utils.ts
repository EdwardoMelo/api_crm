import {
  BUDGET_EMAIL_VARIABLE_KEYS,
  BudgetEmailVariableKey,
} from '../constants/budget-email-variables.constants';

export interface BudgetEmailEmpresaContext {
  nome: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
}

export interface BudgetEmailClienteContext {
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  documento: string | null;
}

export interface BudgetEmailOrcamentoContext {
  titulo: string;
  valor: number;
  valorFormatado: string;
  descricao: string | null;
  validade: string | null;
  validadeFormatada: string | null;
}

export interface BudgetEmailUsuarioContext {
  nome: string;
  email: string;
}

export interface BudgetEmailVariableContext {
  empresa: BudgetEmailEmpresaContext;
  cliente: BudgetEmailClienteContext;
  orcamento: BudgetEmailOrcamentoContext;
  usuario: BudgetEmailUsuarioContext;
}

export interface BudgetEmailTemplatePreview {
  assunto: string;
  corpo: string;
  variaveis: BudgetEmailVariableKey[];
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

export function formatBudgetCurrency(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatBudgetDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('pt-BR');
}

export function buildBudgetEmailVariableMap(
  context: BudgetEmailVariableContext,
  linkArquivo?: string | null,
): Map<BudgetEmailVariableKey, string[]> {
  const map = new Map<BudgetEmailVariableKey, string[]>();
  const push = (key: BudgetEmailVariableKey, ...values: Array<string | null | undefined>) => {
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

export function resolveBudgetEmailTemplate(
  text: string,
  context: BudgetEmailVariableContext,
  linkArquivo?: string | null,
): string {
  const variableMap = buildBudgetEmailVariableMap(context, linkArquivo);
  return text.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    if (!BUDGET_EMAIL_VARIABLE_KEYS.includes(key as BudgetEmailVariableKey)) {
      return match;
    }
    const values = variableMap.get(key as BudgetEmailVariableKey);
    return values?.[0] ?? match;
  });
}

export function detectBudgetEmailVariables(
  assunto: string,
  corpo: string,
  context: BudgetEmailVariableContext,
  linkArquivo?: string | null,
): BudgetEmailTemplatePreview {
  const variableMap = buildBudgetEmailVariableMap(context, linkArquivo);
  const entries = [...variableMap.entries()]
    .flatMap(([key, values]) => values.map((value) => ({ key, value })))
    .filter((entry) => entry.value.length >= 2)
    .sort((a, b) => b.value.length - a.value.length);

  const usedKeys = new Set<BudgetEmailVariableKey>();
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
