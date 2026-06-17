import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

/**
 * Logger da aplicação baseado no ConsoleLogger do NestJS.
 * Centraliza a configuração de níveis de log conforme o ambiente.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor() {
    super('CRM');
  }

  static levelsForEnv(env: string | undefined): LogLevel[] {
    if (env === 'production') {
      return ['error', 'warn', 'log'];
    }
    if (env === 'test') {
      return ['error', 'warn'];
    }
    return ['error', 'warn', 'log', 'debug', 'verbose'];
  }
}
