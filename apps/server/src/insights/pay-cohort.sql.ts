import { Prisma } from "@repo/db";
import type { PayFilters } from "@repo/shared";
import { baseUsdSql } from "./insights.constants";

export function activePayWhere(query: PayFilters) {
	const conditions = [Prisma.sql`e.status = 'active'`];
	if (query.countryCode)
		conditions.push(Prisma.sql`e.countryCode = ${query.countryCode}`);
	if (query.department)
		conditions.push(Prisma.sql`e.department = ${query.department}`);
	if (query.jobTitle)
		conditions.push(Prisma.sql`e.jobTitle = ${query.jobTitle}`);
	if (query.level) conditions.push(Prisma.sql`e.level = ${query.level}`);
	return Prisma.join(conditions, " AND ");
}
export function payCohortSql(query: PayFilters) {
	return Prisma.sql`cohort AS (
		SELECT e.id, e.name, e.level, e.gender, ${baseUsdSql} AS baseUsd
		FROM Employee e JOIN FxRate f ON e.currencyCode = f.currencyCode
		WHERE ${activePayWhere(query)}
	)`;
}
