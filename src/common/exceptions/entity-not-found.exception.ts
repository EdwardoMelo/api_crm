import { NotFoundException } from '@nestjs/common';

/**
 * Exceção de domínio para entidade não encontrada.
 * Padroniza a mensagem e o status HTTP 404 em toda a aplicação.
 */
export class EntityNotFoundException extends NotFoundException {
  constructor(entity: string, id: string | number) {
    super(`${entity} com id "${id}" não encontrado(a).`);
  }
}
