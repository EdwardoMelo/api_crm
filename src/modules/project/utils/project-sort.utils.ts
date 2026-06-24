import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import { DEFAULT_PROJECT_SORT_FIELD, ProjectSortField } from '../constants/project-sort.constants';

export const projectListSort = createEntityListSort<ProjectSortField>({
  defaultField: DEFAULT_PROJECT_SORT_FIELD,
  prismaFieldMap: {
    [ProjectSortField.CREATED_AT]: 'createdAt',
    [ProjectSortField.TITULO]: 'titulo',
    [ProjectSortField.VALOR_TOTAL]: 'valorTotal',
    [ProjectSortField.STATUS]: 'status',
    [ProjectSortField.DATA_INICIO]: 'dataInicio',
    [ProjectSortField.DATA_FIM_PREVISTA]: 'dataFimPrevista',
  },
});
