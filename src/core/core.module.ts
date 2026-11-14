import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DataBaseModule } from '../database/database.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * App-wide security. Registers the login guard for every route.
 * Routes that need no login are marked with @Public().
 */
@Module({
  imports: [
    DataBaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class CoreModule {}