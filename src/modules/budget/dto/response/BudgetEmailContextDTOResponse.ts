import {
  BudgetEmailClienteContext,
  BudgetEmailEmpresaContext,
  BudgetEmailOrcamentoContext,
  BudgetEmailUsuarioContext,
  BudgetEmailVariableContext,
} from '../../utils/budget-email-template.utils';
import { BudgetEmailTemplateDTOResponse } from './BudgetEmailTemplateDTOResponse';
import { BudgetFileDTOResponse } from './BudgetFileDTOResponse';

export class BudgetEmailContextDTOResponse {
  empresa: BudgetEmailEmpresaContext;
  cliente: BudgetEmailClienteContext;
  orcamento: BudgetEmailOrcamentoContext;
  usuario: BudgetEmailUsuarioContext;
  arquivo: BudgetFileDTOResponse | null;
  templates: BudgetEmailTemplateDTOResponse[];
  assuntoSugerido: string;
  destinatario: string;

  static build(params: {
    context: BudgetEmailVariableContext;
    arquivo: BudgetFileDTOResponse | null;
    templates: BudgetEmailTemplateDTOResponse[];
  }): BudgetEmailContextDTOResponse {
    const dto = new BudgetEmailContextDTOResponse();
    dto.empresa = params.context.empresa;
    dto.cliente = params.context.cliente;
    dto.orcamento = params.context.orcamento;
    dto.usuario = params.context.usuario;
    dto.arquivo = params.arquivo;
    dto.templates = params.templates;
    dto.assuntoSugerido = `Orçamento: ${params.context.orcamento.titulo}`;
    dto.destinatario = params.context.cliente.email;
    return dto;
  }
}

export class BudgetEmailTemplatePreviewDTOResponse {
  assunto: string;
  corpo: string;
  variaveis: string[];
}

export class SendBudgetEmailResultDTOResponse {
  emailLogId: number;
  budgetStatus: string;
  modoAnexo: 'ANEXO' | 'LINK';
}
