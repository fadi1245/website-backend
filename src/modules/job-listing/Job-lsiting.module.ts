import { Module } from "@nestjs/common";
import { DataBaseModule } from "src/database/database.module";
import { JobListingController } from "./job-listing.controller";
import { JobListingService } from "./job-listing.service";

@Module({
  imports: [DataBaseModule],
  controllers: [JobListingController],
  providers: [JobListingService],
  exports: [],
})

export class JobListingModule {}