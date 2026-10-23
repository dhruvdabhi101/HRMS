import { Prisma } from "@repo/db";
import type { PayFilters } from "@repo/shared";
import { payCohortSql } from "./pay-cohort.sql";

export function genderPaySql(query: PayFilters) {
	return Prisma.sql`WITH ${payCohortSql(query)}, ranked AS (
		SELECT *, ROW_NUMBER() OVER (PARTITION BY level, gender ORDER BY baseUsd, id) AS position,
			COUNT(*) OVER (PARTITION BY level, gender) AS groupSize FROM cohort
	), medians AS (
		SELECT level, gender, COUNT(*) AS headcount,
			AVG(CASE WHEN position IN ((groupSize + 1) / 2, (groupSize + 2) / 2) THEN baseUsd END) AS median
		FROM ranked GROUP BY level, gender
	), comparisons AS (
		SELECT level, MAX(CASE WHEN gender = 'woman' THEN median END) AS womenMedian,
			MAX(CASE WHEN gender = 'man' THEN median END) AS menMedian,
			COALESCE(MAX(CASE WHEN gender = 'woman' THEN headcount END), 0) AS womenCount,
			COALESCE(MAX(CASE WHEN gender = 'man' THEN headcount END), 0) AS menCount
		FROM medians GROUP BY level
	)
	SELECT m.*, CASE WHEN c.menMedian > 0 AND c.womenMedian IS NOT NULL
		THEN ROUND((c.menMedian - c.womenMedian) * 100.0 / c.menMedian, 2) END AS gapPercent,
		(c.womenCount < 5 OR c.menCount < 5) AS smallSample
	FROM medians m JOIN comparisons c ON c.level = m.level ORDER BY m.level, m.gender`;
}
