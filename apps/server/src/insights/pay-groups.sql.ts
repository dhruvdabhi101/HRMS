import { Prisma } from "@repo/db";
import { PayGroupsQueryDto } from "./dto/pay-groups-query.dto";
import { payDimensionSql, payMetricSql } from "./insights.constants";
import { activePayWhere } from "./pay-cohort.sql";

export function payGroupsSql(query: PayGroupsQueryDto) {
	const first = payDimensionSql[query.dimensions[0]];
	const second = query.dimensions[1]
		? payDimensionSql[query.dimensions[1]]
		: Prisma.sql`NULL`;
	return Prisma.sql`
		WITH local_pay AS (
			SELECT ${first} AS d1, ${second} AS d2, e.annualBaseMinor AS baseMinor,
				e.annualBaseMinor + (e.annualBaseMinor * e.bonusTargetBps + 5000) / 10000 AS targetMinor,
				f.usdRateMicros
			FROM Employee e JOIN FxRate f ON f.currencyCode = e.currencyCode
			WHERE ${activePayWhere(query)}
		), usd_pay AS (
			SELECT d1, d2, (baseMinor * usdRateMicros + 500000) / 1000000 AS baseUsd,
				(targetMinor * usdRateMicros + 500000) / 1000000 AS targetUsd
			FROM local_pay
		), ranked AS (
			SELECT *, ROW_NUMBER() OVER (PARTITION BY d1, d2 ORDER BY baseUsd) AS position,
				COUNT(*) OVER (PARTITION BY d1, d2) AS groupSize
			FROM usd_pay
		)
		SELECT d1, d2, COUNT(*) AS headcount, ${payMetricSql[query.metric]} AS value
		FROM ranked GROUP BY d1, d2 ORDER BY d1, d2`;
}
