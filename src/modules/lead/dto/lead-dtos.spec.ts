import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LeadStatus } from '@prisma/client';
import { ConvertLeadDTORequest } from './request/ConvertLeadDTORequest';
import { CreateLeadDTORequest } from './request/CreateLeadDTORequest';
import { ListLeadDTOQuery } from './request/ListLeadDTOQuery';
import { LeadDTOResponse } from './response/LeadDTOResponse';

describe('Lead DTOs', () => {
  describe('CreateLeadDTORequest', () => {
    it('aceita payload mínimo (apenas nome)', async () => {
      const dto = plainToInstance(CreateLeadDTORequest, { nome: 'Maria Lead' });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('rejeita quando nome está ausente', async () => {
      const dto = plainToInstance(CreateLeadDTORequest, {});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'nome')).toBe(true);
    });

    it('rejeita e-mail inválido', async () => {
      const dto = plainToInstance(CreateLeadDTORequest, {
        nome: 'Maria',
        email: 'nao-e-email',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('rejeita status fora do enum', async () => {
      const dto = plainToInstance(CreateLeadDTORequest, {
        nome: 'Maria',
        status: 'INVALIDO',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });

    it('aceita status válido', async () => {
      const dto = plainToInstance(CreateLeadDTORequest, {
        nome: 'Maria',
        status: LeadStatus.QUALIFICADO,
      });
      expect(await validate(dto)).toHaveLength(0);
    });
  });

  describe('ConvertLeadDTORequest', () => {
    it('exige nome e email', async () => {
      const dto = plainToInstance(ConvertLeadDTORequest, {});
      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('nome');
      expect(props).toContain('email');
    });

    it('aceita payload completo', async () => {
      const dto = plainToInstance(ConvertLeadDTORequest, {
        nome: 'Maria Lead',
        email: 'maria@lead.com',
        documento: '123456',
      });
      expect(await validate(dto)).toHaveLength(0);
    });
  });

  describe('ListLeadDTOQuery', () => {
    it('aceita sortBy válido', async () => {
      const dto = plainToInstance(ListLeadDTOQuery, { sortBy: 'nome', sortOrder: 'asc' });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('rejeita sortBy inválido', async () => {
      const dto = plainToInstance(ListLeadDTOQuery, { sortBy: 'inexistente' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'sortBy')).toBe(true);
    });
  });

  describe('LeadDTOResponse.fromEntity', () => {
    it('mapeia os campos da entidade', () => {
      const result = LeadDTOResponse.fromEntity({
        id: 1,
        tenantId: 1,
        nome: 'Maria Lead',
        email: 'maria@lead.com',
        telefone: null,
        empresa: null,
        origem: 'Instagram',
        observacoes: null,
        status: LeadStatus.NOVO,
        convertedClientId: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        createdBy: '1',
        updatedBy: '1',
      } as never);

      expect(result.id).toBe(1);
      expect(result.origem).toBe('Instagram');
      expect(result.status).toBe(LeadStatus.NOVO);
      expect(result.convertedClientId).toBeNull();
    });
  });
});
