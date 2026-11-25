import { Module } from "@nestjs/common";
import { DataBaseModule } from "src/database/database.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
    imports:[DataBaseModule],
    controllers:[LeadsController],
    providers:[LeadsService],
    exports:[]
})

export class LeadsModule {}