import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { PayGroupsResponse } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { PayGroupsQueryDto } from "./dto/pay-groups-query.dto";
import type { PayGroupRow } from "./insights.types";
import { payGroupsSql } from "./pay-groups.sql";

@Injectable()
export class InsightsService {
	constructor(private readonly prisma: PrismaService) {}

	async groups(query: PayGroupsQueryDto): Promise<PayGroupsResponse> {
		return this.prisma.$transaction(async (tx) => {
			const fxRates = await tx.fxRate.findMany({
				orderBy: { currencyCode: "asc" },
			});
			if (
				fxRates.some(
					(rate) =>
						!Number.isSafeInteger(rate.usdRateMicros) ||
						rate.usdRateMicros <= 0,
				)
			) {
				throw new ServiceUnavailableException(
					"Reports require positive fixed FX rates.",
				);
			}
			const rows = await tx.$queryRaw<PayGroupRow[]>(payGroupsSql(query));
			const groups = rows.map((row) => ({
				dimensions: Object.fromEntries(
					query.dimensions.map((dimension, index) => [
						dimension,
						index === 0 ? row.d1 : row.d2,
					]),
				),
				headcount: Number(row.headcount),
				value: Number(row.value),
			}));
			if (groups.some((group) => !Number.isSafeInteger(group.value)))
				throw new ServiceUnavailableException(
					"Report amount exceeds supported precision.",
				);
			return {
				dimensions: query.dimensions,
				metric: query.metric,
				currencyCode: "USD",
				groups,
				fxRates: fxRates.map((rate) => ({
					currencyCode: rate.currencyCode,
					usdRateMicros: rate.usdRateMicros,
					asOfDate: rate.asOfDate.toISOString().slice(0, 10),
				})),
			};
		});
	}
}
