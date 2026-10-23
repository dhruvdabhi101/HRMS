import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@repo/db";
import type {
	PayDistributionResponse,
	PayDistributionSummary,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { distributionCte, distributionSummarySql } from "./distribution.sql";
import { PayDistributionQueryDto } from "./dto/pay-distribution-query.dto";
import { baseUsdSql } from "./insights.constants";
import type {
	DistributionSummaryRow,
	EmployeePositionRow,
	PayOutlierRow,
} from "./insights.types";
import { readReportRates } from "./report-rates.utils";

@Injectable()
export class PayDistributionService {
	constructor(private readonly prisma: PrismaService) {}

	async distribution(
		query: PayDistributionQueryDto,
	): Promise<PayDistributionResponse> {
		return this.prisma.$transaction(async (tx) => {
			const fxRates = await readReportRates(tx);
			const [row] = await tx.$queryRaw<DistributionSummaryRow[]>(
				distributionSummarySql(query),
			);
			const summary = Number(row.headcount)
				? ({
						...Object.fromEntries(
							Object.entries(row).map(([key, value]) => [key, Number(value)]),
						),
						smallSample: Number(row.headcount) < 4,
					} as PayDistributionSummary)
				: null;
			const items = await tx.$queryRaw<
				PayOutlierRow[]
			>(Prisma.sql`${distributionCte(query)}
				SELECT id, name, baseUsd AS annualBaseUsd FROM classified WHERE isOutlier = 1
				ORDER BY baseUsd, id LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`);
			const employee = query.employeeId
				? await this.employeePosition(tx, query)
				: null;
			return {
				currencyCode: "USD",
				fxRates,
				summary,
				employee,
				outliers: {
					items: items.map((item) => ({
						...item,
						annualBaseUsd: Number(item.annualBaseUsd),
					})),
					totalCount: Number(row.outlierCount),
					page: query.page,
					pageSize: query.pageSize,
				},
			};
		});
	}

	private async employeePosition(
		tx: Prisma.TransactionClient,
		query: PayDistributionQueryDto,
	) {
		const [row] = await tx.$queryRaw<
			EmployeePositionRow[]
		>(Prisma.sql`${distributionCte(query)}
			SELECT e.id, e.name, e.status, ${baseUsdSql} AS annualBaseUsd,
				c.id IS NOT NULL AS includedInCohort, CASE WHEN s.headcount >= 4 THEN c.isOutlier END AS isOutlier
			FROM Employee e JOIN FxRate f ON e.currencyCode = f.currencyCode CROSS JOIN fences s
			LEFT JOIN classified c ON c.id = e.id WHERE e.id = ${query.employeeId}`);
		if (!row) throw new NotFoundException("Employee not found");
		return {
			...row,
			annualBaseUsd: Number(row.annualBaseUsd),
			includedInCohort: Boolean(row.includedInCohort),
			isOutlier: row.isOutlier === null ? null : Boolean(row.isOutlier),
		};
	}
}
