import 'reflect-metadata';
import { TipoContratacao } from '@prisma/client';
import { CreateEmployeeDTORequest } from './request/CreateEmployeeDTORequest';
import { ListEmployeeDTOQuery } from './request/ListEmployeeDTOQuery';
import { UpdateEmployeeDTORequest } from './request/UpdateEmployeeDTORequest';
import { EmployeeDTOResponse } from './response/EmployeeDTOResponse';

describe('Employee DTOs', () => {
  it('CreateEmployeeDTORequest instancia campos', () => {
    const dto = new CreateEmployeeDTORequest();
    dto.nome = 'Ana';
    dto.email = 'ana@test.com';
    dto.tipoContratacao = TipoContratacao.CLT;
    dto.salarioBase = 5000;
    dto.ativo = true;
    expect(dto.nome).toBe('Ana');
  });

  it('UpdateEmployeeDTORequest instancia campos opcionais', () => {
    const dto = new UpdateEmployeeDTORequest();
    dto.cargo = 'Dev';
    expect(dto.cargo).toBe('Dev');
  });

  it('ListEmployeeDTOQuery instancia sort', () => {
    const dto = new ListEmployeeDTOQuery();
    dto.sortBy = 'nome' as never;
    dto.sortOrder = 'asc' as never;
    expect(dto.sortBy).toBe('nome');
  });

  it('EmployeeDTOResponse.fromEntity converte salario', () => {
    const result = EmployeeDTOResponse.fromEntity({
      id: 1,
      nome: 'Ana',
      email: 'ana@test.com',
      telefone: null,
      cargo: null,
      tipoContratacao: TipoContratacao.CLT,
      salarioBase: '8000.50' as never,
      ativo: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    } as never);
    expect(result.salarioBase).toBe(8000.5);
  });

  it('EmployeeDTOResponse.fromEntities mapeia lista', () => {
    const list = EmployeeDTOResponse.fromEntities([
      {
        id: 1,
        nome: 'Ana',
        email: 'a@t.com',
        telefone: null,
        cargo: null,
        tipoContratacao: TipoContratacao.CLT,
        salarioBase: null,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ]);
    expect(list).toHaveLength(1);
  });
});
