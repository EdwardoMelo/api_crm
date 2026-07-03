import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import { LeadSortField, DEFAULT_LEAD_SORT_FIELD } from '../constants/lead-sort.constants';

export const leadListSort = createEntityListSort<LeadSortField>({
  defaultField: DEFAULT_LEAD_SORT_FIELD,
  prismaFieldMap: {
    [LeadSortField.CREATED_AT]: 'createdAt',
    [LeadSortField.NOME]: 'nome',
    [LeadSortField.EMAIL]: 'email',
    [LeadSortField.EMPRESA]: 'empresa',
    [LeadSortField.STATUS]: 'status',
  },
});
