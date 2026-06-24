import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import { ClientSortField, DEFAULT_CLIENT_SORT_FIELD } from '../constants/client-sort.constants';

export const clientListSort = createEntityListSort<ClientSortField>({
  defaultField: DEFAULT_CLIENT_SORT_FIELD,
  prismaFieldMap: {
    [ClientSortField.CREATED_AT]: 'createdAt',
    [ClientSortField.NOME]: 'nome',
    [ClientSortField.EMAIL]: 'email',
    [ClientSortField.EMPRESA]: 'empresa',
    [ClientSortField.VALOR_ORCADO]: 'valorOrcado',
    [ClientSortField.VALOR_VENDIDO]: 'valorVendido',
  },
  inMemoryFields: [ClientSortField.VALOR_ORCADO, ClientSortField.VALOR_VENDIDO],
});
