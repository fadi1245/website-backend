import { Module } from "@nestjs/common";
import { DataBaseModule } from "src/database/database.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { EmailModule } from "src/shared/email/email.module";

@Module({
    imports:[DataBaseModule, EmailModule],
    controllers:[LeadsController],
    providers:[LeadsService],
    exports:[]
})

export class LeadsModule {}