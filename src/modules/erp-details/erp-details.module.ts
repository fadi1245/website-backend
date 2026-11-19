import { Module } from '@nestjs/common';
import { DataBaseModule } from '../../database/database.module';
import { S3Service } from 'src/shared/utils/S3.service';
import { ErpDetailsController } from './erp-details.controller';
import { ErpDetailsService } from './erp-details.service';

@Module({
  imports: [DataBaseModule],
  controllers: [ErpDetailsController],
  providers: [S3Service, ErpDetailsService],
})
export class ErpDetailsrModule {}