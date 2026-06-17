import { Transform } from 'class-transformer';

/**
 * Remove espaços em branco no início/fim de strings recebidas em DTOs.
 * Uso: @Trim() em cima de uma propriedade string.
 */
export function Trim(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}
