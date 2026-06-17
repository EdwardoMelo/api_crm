import { BadRequestException } from '@nestjs/common';

/**
 * Exceção de domínio para violação de regra de negócio.
 * Mapeia para HTTP 400.
 */
export class BusinessRuleException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
