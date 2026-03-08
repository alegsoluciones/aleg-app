import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { ClsMiddleware } from 'nestjs-cls';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditService } from './audit/audit.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configuración de CORS [DEV MODE]
  app.enableCors({ isOriginAllowed: (origin) => true, credentials: true });

  // 2. Aumentar límites para subir fotos grandes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 3. Validaciones Globales
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new AuditInterceptor(app.get(AuditService)));

  // --- SWAGGER CONFIGURATION (PROTOCOL ROSETTA) ---
  // 🔒 HARDENING: Only available in Development or explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('ALEG APP SaaS API')
      .setDescription('Plataforma Multi-Tenant para Gestión Clínica, Agendamiento y Facturación')
      .setVersion('2.5.0')
      .addBearerAuth() // JWT Support
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document); // La ruta será /docs
  }

  // 5. Arrancar
  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Servidor listo en: ${await app.getUrl()}`);

  // Log Swagger URL only if enabled
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    console.log(`📄 Documentación (Swagger) activa en: ${await app.getUrl()}/docs`);
  } else {
    console.log(`🔒 Swagger desactivado por seguridad (Production Mode).`);
  }
}
bootstrap();