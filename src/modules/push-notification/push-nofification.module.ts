
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataBaseModule } from 'src/database/database.module';
import { OneSignalService } from './onesignal.service';
import { PushNotificationsController } from './push-notification.controller';
import { PushNotificationsService } from './push-notification.service';

@Module({
  imports: [
    DataBaseModule,
    HttpModule,
  ],
  controllers: [PushNotificationsController],
  providers: [
    PushNotificationsService,
    OneSignalService,
  ],
  exports: [],
})
export class PushNotificationsModule {}
