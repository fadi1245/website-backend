import { Module } from "@nestjs/common";
import { DataBaseModule } from "src/database/database.module";
import { ClientLogosController } from "./client-logos.controller";
import { ClientLogosService } from "./client-logos.service";
import { S3Service } from "src/shared/utils/S3.service";

@Module({
  imports: [DataBaseModule],
  controllers: [ClientLogosController],
  providers: [ClientLogosService, S3Service],
  exports: [],
})

export class ClientLogosModule {}