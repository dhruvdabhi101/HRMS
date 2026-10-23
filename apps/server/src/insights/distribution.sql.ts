import { Prisma } from "@repo/db";
import type { PayFilters } from "@repo/shared";
import { payCohortSql } from "./pay-cohort.sql";

function percentileSql(fraction: number) {
	const position = Prisma.sql`((groupSize - 1) * ${fraction} + 1)`;
	const lower = Prisma.sql`MAX(CASE WHEN position <= ${position} THEN baseUsd END)`;
	const upper = Prisma.sql`MIN(CASE WHEN position >= ${position} THEN baseUsd END)`;
	const offset = Prisma.sql`((MAX(groupSize) - 1) * ${fraction})`;
	return Prisma.sql`${lower} + (${offset} - CAST(${offset} AS INTEGER)) * (${upper} - ${lower})`;
}
export function distributionCte(query: PayFilters) {
	return Prisma.sql`WITH ${payCohortSql(query)}, ranked AS (
		SELECT *, ROW_NUMBER() OVER (ORDER BY baseUsd, id) AS position, COUNT(*) OVER () AS groupSize FROM cohort
	), quartiles AS (
		SELECT COUNT(*) AS headcount, MIN(baseUsd) AS min, MAX(baseUsd) AS max, AVG(baseUsd) AS average,
			${percentileSql(0.25)} AS q1, ${percentileSql(0.5)} AS median, ${percentileSql(0.75)} AS q3 FROM ranked
	), fences AS (
		SELECT *, q1 - 1.5 * (q3 - q1) AS lowerFence, q3 + 1.5 * (q3 - q1) AS upperFence FROM quartiles
	), classified AS (
		SELECT c.*, CASE WHEN f.headcount >= 4 AND (c.baseUsd < f.lowerFence OR c.baseUsd > f.upperFence) THEN 1 ELSE 0 END AS isOutlier
		FROM cohort c CROSS JOIN fences f
	)`;
}
export function distributionSummarySql(query: PayFilters) {
	return Prisma.sql`${distributionCte(query)}
		SELECT f.*, MIN(CASE WHEN c.isOutlier = 0 THEN c.baseUsd END) AS lowerWhisker,
			MAX(CASE WHEN c.isOutlier = 0 THEN c.baseUsd END) AS upperWhisker,
			COALESCE(SUM(c.isOutlier), 0) AS outlierCount FROM fences f LEFT JOIN classified c ON 1 = 1`;
}
