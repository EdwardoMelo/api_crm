export enum ClientSortField {
  CREATED_AT = 'createdAt',
  NOME = 'nome',
  EMAIL = 'email',
  EMPRESA = 'empresa',
  VALOR_ORCADO = 'valorOrcado',
  VALOR_VENDIDO = 'valorVendido',
}

export const DEFAULT_CLIENT_SORT_FIELD = ClientSortField.CREATED_AT;
