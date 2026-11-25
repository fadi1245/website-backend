import { Module } from "@nestjs/common";
import { DataBaseModule } from "src/database/database.module";
import { JobApplicationService } from "./job-application.service";
import { JobApplicationController } from "./job-application.controller";
import { S3Service } from "src/shared/utils/S3.service";

@Module({
  imports: [DataBaseModule],
  controllers: [JobApplicationController],
  providers: [S3Service, JobApplicationService],
  exports: [],
})

export class JobApplicationModule {}