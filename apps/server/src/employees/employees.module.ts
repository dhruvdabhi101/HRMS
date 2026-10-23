import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmployeeDirectoryService } from "./employee-directory.service";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";

@Module({
	imports: [PrismaModule],
	controllers: [EmployeesController],
	providers: [EmployeesService, EmployeeDirectoryService],
})
export class EmployeesModule {}
