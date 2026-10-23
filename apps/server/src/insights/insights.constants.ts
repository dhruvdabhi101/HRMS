import { Prisma } from "@repo/db";
import type { PayDimension, PayMetric } from "@repo/shared";

export const payDimensionSql: Record<PayDimension, Prisma.Sql> = {
	country: Prisma.sql`e.countryCode`,
	department: Prisma.sql`e.department`,
	level: Prisma.sql`e.level`,
	title: Prisma.sql`e.jobTitle`,
};
export const payMetricSql: Record<PayMetric, Prisma.Sql> = {
	headcount: Prisma.sql`COUNT(*)`,
	min: Prisma.sql`MIN(baseUsd)`,
	max: Prisma.sql`MAX(baseUsd)`,
	average: Prisma.sql`(SUM(baseUsd) + COUNT(*) / 2) / COUNT(*)`,
	median: Prisma.sql`CAST(ROUND(AVG(CASE WHEN position IN ((groupSize + 1) / 2, (groupSize + 2) / 2) THEN baseUsd END), 0) AS INTEGER)`,
	totalTarget: Prisma.sql`SUM(targetUsd)`,
};
