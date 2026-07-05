import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppLogger } from './common/logger';
import { WorkerModule } from './worker/worker.module';

/**
 * Entrypoint do processo worker (consumidor RabbitMQ) de campanhas de e-mail.
 * Roda como um processo separado da API HTTP (ex.: `pm2 start dist/worker.main.js`).
 */
async function bootstrap(): Promise<void> {
  const logger = new AppLogger();
  logger.setLogLevels(AppLogger.levelsForEnv(process.env.NODE_ENV));

  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const queue = process.env.RABBITMQ_CAMPAIGN_QUEUE ?? 'crm.email.campaign';
  const prefetchCount = Number(process.env.RABBITMQ_PREFETCH ?? 1);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(WorkerModule, {
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      prefetchCount,
      noAck: false,
      queueOptions: { durable: true },
    },
    bufferLogs: true,
  });

  app.useLogger(logger);
  await app.listen();
  logger.log(`Worker de campanhas de e-mail ouvindo a fila "${queue}"`);
}

void bootstrap();
