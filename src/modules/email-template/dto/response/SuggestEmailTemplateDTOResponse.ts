export class SuggestEmailTemplateDTOResponse {
  assunto: string;
  corpo: string;
  variaveis: string[];

  static build(params: {
    assunto: string;
    corpo: string;
    variaveis: string[];
  }): SuggestEmailTemplateDTOResponse {
    const dto = new SuggestEmailTemplateDTOResponse();
    dto.assunto = params.assunto;
    dto.corpo = params.corpo;
    dto.variaveis = params.variaveis;
    return dto;
  }
}
