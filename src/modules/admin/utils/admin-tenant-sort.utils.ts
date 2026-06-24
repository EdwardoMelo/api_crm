import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import {
  AdminTenantSortField,
  DEFAULT_ADMIN_TENANT_SORT_FIELD,
} from '../constants/admin-tenant-sort.constants';

export const adminTenantListSort = createEntityListSort<AdminTenantSortField>({
  defaultField: DEFAULT_ADMIN_TENANT_SORT_FIELD,
  prismaFieldMap: {
    [AdminTenantSortField.CREATED_AT]: 'createdAt',
    [AdminTenantSortField.NOME]: 'nome',
    [AdminTenantSortField.SLUG]: 'slug',
    [AdminTenantSortField.TIPO]: 'tipo',
    [AdminTenantSortField.ATIVO]: 'ativo',
    [AdminTenantSortField.TOTAL_USUARIOS]: 'totalUsuarios',
    [AdminTenantSortField.TOTAL_CLIENTES]: 'totalClientes',
  },
  inMemoryFields: [AdminTenantSortField.TOTAL_USUARIOS, AdminTenantSortField.TOTAL_CLIENTES],
});
