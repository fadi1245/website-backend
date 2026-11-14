import { Global, Module } from '@nestjs/common';
import { DataBaseModule } from '../database/database.module';
import { PaginationService } from './utils/pagination.service';
import { AuditService } from './utils/audit.service';

/** Helpers every module can use without importing anything. */
@Global()
@Module({
  imports: [DataBaseModule],
  providers: [PaginationService, AuditService],
  exports: [PaginationService, AuditService],
})
export class SharedModule {}