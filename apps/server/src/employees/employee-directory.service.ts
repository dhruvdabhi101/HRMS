import { Injectable } from "@nestjs/common";
import { Prisma } from "@repo/db";
import {
	EmployeeDirectoryResponse,
	EmployeeFilterOptions,
	EmployeeListItem,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EmployeeDirectoryQueryDto } from "./dto/employee-directory-query.dto";
import { directoryOrder, directoryWhere } from "./employee-directory.sql";

@Injectable()
export class EmployeeDirectoryService {
	constructor(private readonly prisma: PrismaService) {}

	async list(
		query: EmployeeDirectoryQueryDto,
	): Promise<EmployeeDirectoryResponse> {
		const where = directoryWhere(query);
		const [items, counts] = await this.prisma.$transaction([
			this.prisma.$queryRaw<EmployeeListItem[]>(Prisma.sql`
				SELECT id, name, countryCode, department, jobTitle, level, status, currencyCode, annualBaseMinor, bonusTargetBps
				FROM Employee ${where} ${directoryOrder(query)} LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
			`),
			this.prisma.$queryRaw<{ total: bigint }[]>(
				Prisma.sql`SELECT COUNT(*) AS total FROM Employee ${where}`,
			),
		]);
		return {
			items,
			totalCount: Number(counts[0].total),
			page: query.page,
			pageSize: query.pageSize,
		};
	}

	async filterOptions(): Promise<EmployeeFilterOptions> {
		const [departments, jobTitles] = await this.prisma.$transaction([
			this.prisma.$queryRaw<
				{ department: string }[]
			>`SELECT DISTINCT department FROM Employee ORDER BY department`,
			this.prisma.$queryRaw<
				{ jobTitle: string }[]
			>`SELECT DISTINCT jobTitle FROM Employee ORDER BY jobTitle`,
		]);
		return {
			departments: departments.map(({ department }) => department),
			jobTitles: jobTitles.map(({ jobTitle }) => jobTitle),
		};
	}
}
