import {
  BudgetEmailVariableContext,
  detectBudgetEmailVariables,
  resolveBudgetEmailTemplate,
} from './budget-email-template.utils';

const context: BudgetEmailVariableContext = {
  empresa: {
    nome: 'Daitx Ltda',
    razaoSocial: 'Daitx Tecnologia Ltda',
    nomeFantasia: 'Daitx',
    cnpj: '12345678000199',
    email: 'contato@daitx.com',
    telefone: '11999999999',
    endereco: 'Rua A, 100, São Paulo, SP',
  },
  cliente: {
    nome: 'João Silva',
    email: 'joao@cliente.com',
    telefone: '11888888888',
    empresa: 'Cliente SA',
    documento: '12345678901',
  },
  orcamento: {
    titulo: 'Site institucional',
    valor: 1500,
    valorFormatado: 'R$ 1.500,00',
    descricao: 'Desenvolvimento de site',
    validade: '2026-07-01T00:00:00.000Z',
    validadeFormatada: '01/07/2026',
  },
  usuario: {
    nome: 'Maria',
    email: 'maria@daitx.com',
  },
};

describe('budget-email-template.utils', () => {
  it('resolve placeholders with context values', () => {
    const result = resolveBudgetEmailTemplate(
      'Olá, {{cliente.nome}}! Valor: {{orcamento.valorFormatado}}',
      context,
    );
    expect(result).toBe('Olá, João Silva! Valor: R$ 1.500,00');
  });

  it('detects variables from body text', () => {
    const assunto = 'Orçamento: Site institucional';
    const corpo = `Olá, João Silva!

Segue o orçamento Site institucional no valor de R$ 1.500,00.

Atenciosamente,
Maria`;

    const preview = detectBudgetEmailVariables(assunto, corpo, context);
    expect(preview.variaveis).toContain('cliente.nome');
    expect(preview.variaveis).toContain('orcamento.titulo');
    expect(preview.variaveis).toContain('orcamento.valorFormatado');
    expect(preview.variaveis).toContain('usuario.nome');
    expect(preview.corpo).toContain('{{cliente.nome}}');
    expect(preview.assunto).toContain('{{orcamento.titulo}}');
  });

  it('prefers longer matches to avoid partial replacements', () => {
    const shortNameContext: BudgetEmailVariableContext = {
      ...context,
      cliente: { ...context.cliente, nome: 'Jo' },
      orcamento: { ...context.orcamento, titulo: 'João projeto completo' },
    };

    const preview = detectBudgetEmailVariables(
      'João projeto completo',
      'Para Jo',
      shortNameContext,
    );

    expect(preview.assunto).toBe('{{orcamento.titulo}}');
    expect(preview.corpo).toBe('Para {{cliente.nome}}');
  });
});
