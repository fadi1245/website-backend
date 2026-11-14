import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import multer from 'multer';
import { MulterModule } from '@nestjs/platform-express';
import { DataBaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoreModule } from './core/core.module';
import { ContactInfoModule } from './modules/contact-info/contact-info.module';
import { SharedModule } from './shared/shared.module';
import { ClientLogosModule } from './modules/client-logos/client-logos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    DataBaseModule,
    CoreModule,
    AuthModule,
    ContactInfoModule,
    SharedModule,
    ClientLogosModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), //1 minute, 100 requests
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
