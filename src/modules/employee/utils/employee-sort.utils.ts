import { createEntityListSort } from '../../../common/sorting/entity-list-sort';
import { DEFAULT_EMPLOYEE_SORT_FIELD, EmployeeSortField } from '../constants/employee-sort.constants';

export const employeeListSort = createEntityListSort<EmployeeSortField>({
  defaultField: DEFAULT_EMPLOYEE_SORT_FIELD,
  prismaFieldMap: {
    [EmployeeSortField.CREATED_AT]: 'createdAt',
    [EmployeeSortField.NOME]: 'nome',
    [EmployeeSortField.EMAIL]: 'email',
    [EmployeeSortField.CARGO]: 'cargo',
    [EmployeeSortField.TIPO_CONTRATACAO]: 'tipoContratacao',
    [EmployeeSortField.SALARIO_BASE]: 'salarioBase',
    [EmployeeSortField.ATIVO]: 'ativo',
  },
});
