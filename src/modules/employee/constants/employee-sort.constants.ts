export enum EmployeeSortField {
  CREATED_AT = 'createdAt',
  NOME = 'nome',
  EMAIL = 'email',
  CARGO = 'cargo',
  TIPO_CONTRATACAO = 'tipoContratacao',
  SALARIO_BASE = 'salarioBase',
  ATIVO = 'ativo',
}

export const DEFAULT_EMPLOYEE_SORT_FIELD = EmployeeSortField.CREATED_AT;
