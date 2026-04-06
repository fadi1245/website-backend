import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './shared/filters/http-exception.filter';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //remove properties that are not in the DTO
      forbidNonWhitelisted: true, //throw an error if a property that is not in the DTO is sent
      transform: true, //transform the payload to the DTO type
      transformOptions: { enableImplicitConversion: true }, //convert the payload to the DTO type
      stopAtFirstError: true, //stop at the first error
      exceptionFactory: (errors) => { //custom exception factory to return the first error message
        console.log(JSON.stringify(errors, null, 2));
        const firstError = errors[0];
        const constraints = firstError?.constraints;
        const message = constraints ? Object.values(constraints)[0] : 'Bad Request';
        return new BadRequestException(message);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV == 'development') {
    const config = new DocumentBuilder()
      .setTitle('Thijar Currency Monitor API')
      .setDescription(`Thijar Currency Monitor Backend APIs`)
      .setVersion('1.0')

      // ✅ Add JWT Auth
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'access-token', // name used in decorators
      )

      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // ✅ keeps token after refresh
      },
      customSiteTitle: 'Thijar Currency Monitor Docs',
    });
    Logger.log(`📄 Swagger docs at http://localhost:${process.env.PORT}/docs`);
  }

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`🚀 App is listening on http://localhost:${process.env.PORT}`, 'Bootstrap');
  connection.on('error', (err) => {
    Logger.error(`❌ MongoDB connection error: ${err}`, '', 'Mongoose');
  });
}
bootstrap();  
