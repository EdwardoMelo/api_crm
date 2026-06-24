export enum ProjectSortField {
  CREATED_AT = 'createdAt',
  TITULO = 'titulo',
  VALOR_TOTAL = 'valorTotal',
  STATUS = 'status',
  DATA_INICIO = 'dataInicio',
  DATA_FIM_PREVISTA = 'dataFimPrevista',
}

export const DEFAULT_PROJECT_SORT_FIELD = ProjectSortField.CREATED_AT;
