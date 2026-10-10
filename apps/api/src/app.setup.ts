import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

/**
 * Creates the Nest application with every global setting (security headers, cookies, prefix,
 * CORS, validation, Swagger). Shared by the HTTP server (main.ts) and the Vercel function
 * (serverless.ts) so both behave the same.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const appConfig = config.get('app', { infer: true });

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix(appConfig.apiPrefix);
  app.enableCors({ origin: appConfig.corsOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  if (appConfig.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(`${appConfig.name} API`)
        .setDescription('REST API for projects, tasks, milestones, issues, timesheets and reporting')
        .setVersion('1.0')
        .addCookieAuth(config.get('auth', { infer: true }).cookies.accessName)
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup(`${appConfig.apiPrefix}/docs`, app, document);
  }

  return app;
}
