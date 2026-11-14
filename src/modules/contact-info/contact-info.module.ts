import { Module } from '@nestjs/common';
import { DataBaseModule } from '../../database/database.module';
import { ContactInfoController } from './contact-info.controller';
import { ContactInfoService } from './contact-info.service';

@Module({
  imports: [DataBaseModule],
  controllers: [ContactInfoController],
  providers: [ContactInfoService],
})
export class ContactInfoModule {}