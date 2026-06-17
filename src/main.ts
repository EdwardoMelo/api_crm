import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';
import { AppLogger } from './common/logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = new AppLogger();
  logger.setLogLevels(AppLogger.levelsForEnv(process.env.NODE_ENV));
  app.useLogger(logger);

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  if (config.get<string>('CORS_ALLOW_ALL') === 'true') {
    app.enableCors();
  } else {
    const origins = config.get<string>('CORS_ORIGINS');
    app.enableCors({ origin: origins ? origins.split(',') : false });
  }

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT') ?? 5001;
  await app.listen(port);
  logger.log(`🚀 CRM API rodando em http://localhost:${port}/api`);
}

void bootstrap();
