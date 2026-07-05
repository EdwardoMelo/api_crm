export interface EmailTemplateEmpresaContext {
  nome: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
}

export interface EmailTemplateClienteContext {
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  documento: string | null;
}

export interface EmailTemplateOrcamentoContext {
  titulo: string;
  valor: number;
  valorFormatado: string;
  descricao: string | null;
  validade: string | null;
  validadeFormatada: string | null;
}

export interface EmailTemplateUsuarioContext {
  nome: string;
  email: string;
}

export interface EmailTemplateVariableContext {
  empresa: EmailTemplateEmpresaContext;
  cliente: EmailTemplateClienteContext;
  // Opcional: contextos gerais (ex.: campanhas de e-mail) não têm orçamento.
  orcamento?: EmailTemplateOrcamentoContext;
  usuario: EmailTemplateUsuarioContext;
}
