import { Injectable } from "@nestjs/common";
import { Prisma } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import { EmployeeDirectoryQueryDto } from "./dto/employee-directory-query.dto";
import { employeesToCsv } from "./employee-csv.utils";
import { directoryOrder, directoryWhere } from "./employee-directory.sql";
import { EmployeeExportRow } from "./employee-export.types";

@Injectable()
export class EmployeeExportService {
	constructor(private readonly prisma: PrismaService) {}

	async export(query: EmployeeDirectoryQueryDto): Promise<string> {
		const employees = await this.prisma.$queryRaw<
			EmployeeExportRow[]
		>(Prisma.sql`
			SELECT id, name, countryCode, department, jobTitle, level, gender, hireDate, status, currencyCode, annualBaseMinor, bonusTargetBps
			FROM Employee ${directoryWhere(query)} ${directoryOrder(query)}
		`);
		return employeesToCsv(employees);
	}
}
