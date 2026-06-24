import {
  EmailTemplateClienteContext,
  EmailTemplateEmpresaContext,
  EmailTemplateOrcamentoContext,
  EmailTemplateUsuarioContext,
  EmailTemplateVariableContext,
} from '../../../email-template/types/variable-context.types';
import { EmailTemplateDTOResponse } from '../../../email-template/dto/response/EmailTemplateDTOResponse';
import { BudgetFileDTOResponse } from './BudgetFileDTOResponse';

export class BudgetEmailContextDTOResponse {
  empresa: EmailTemplateEmpresaContext;
  cliente: EmailTemplateClienteContext;
  orcamento: EmailTemplateOrcamentoContext;
  usuario: EmailTemplateUsuarioContext;
  arquivo: BudgetFileDTOResponse | null;
  templates: EmailTemplateDTOResponse[];
  assuntoSugerido: string;
  destinatario: string;

  static build(params: {
    context: EmailTemplateVariableContext;
    arquivo: BudgetFileDTOResponse | null;
    templates: EmailTemplateDTOResponse[];
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

export class SendBudgetEmailResultDTOResponse {
  emailLogId: number;
  budgetStatus: string;
  modoAnexo: 'ANEXO' | 'LINK';
}
