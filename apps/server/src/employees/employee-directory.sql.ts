import { Prisma } from "@repo/db";
import { EmployeeDirectoryQueryDto } from "./dto/employee-directory-query.dto";

export function directoryWhere(query: EmployeeDirectoryQueryDto) {
	const conditions: Prisma.Sql[] = [];
	if (query.status !== "all")
		conditions.push(Prisma.sql`status = ${query.status}`);
	if (query.search)
		conditions.push(Prisma.sql`instr(lower(name), lower(${query.search})) > 0`);
	if (query.countryCode)
		conditions.push(Prisma.sql`countryCode = ${query.countryCode}`);
	if (query.department)
		conditions.push(Prisma.sql`department = ${query.department}`);
	if (query.jobTitle) conditions.push(Prisma.sql`jobTitle = ${query.jobTitle}`);
	if (query.level) conditions.push(Prisma.sql`level = ${query.level}`);
	return conditions.length
		? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
		: Prisma.empty;
}

const sortColumns = {
	name: Prisma.sql`name`,
	countryCode: Prisma.sql`countryCode`,
	department: Prisma.sql`department`,
	jobTitle: Prisma.sql`jobTitle`,
	level: Prisma.sql`level`,
};

export function directoryOrder(query: EmployeeDirectoryQueryDto) {
	const direction =
		query.sortDirection === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
	return Prisma.sql`ORDER BY ${sortColumns[query.sortBy]} ${direction}, id ASC`;
}
