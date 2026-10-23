import { Injectable } from "@nestjs/common";
import {
	EMPLOYEE_GENDERS,
	type GenderPayGroup,
	type GenderPayResponse,
	type PayFilters,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { genderPaySql } from "./gender-pay.sql";
import type { GenderPayRow } from "./gender-pay.types";
import { readReportRates } from "./report-rates.utils";

@Injectable()
export class GenderPayService {
	constructor(private readonly prisma: PrismaService) {}

	async gender(query: PayFilters): Promise<GenderPayResponse> {
		return this.prisma.$transaction(async (tx) => {
			const fxRates = await readReportRates(tx);
			const rows = await tx.$queryRaw<GenderPayRow[]>(genderPaySql(query));
			const levels = new Map<string, GenderPayGroup>();
			for (const row of rows) {
				const group = levels.get(row.level) ?? {
					level: row.level,
					genders: [],
					gapPercent: row.gapPercent,
					smallSample: Boolean(row.smallSample),
				};
				group.genders.push({
					gender: row.gender,
					headcount: Number(row.headcount),
					median: Number(row.median),
				});
				levels.set(row.level, group);
			}
			const groups = [...levels.values()];
			for (const group of groups)
				group.genders.sort(
					(a, b) =>
						EMPLOYEE_GENDERS.indexOf(a.gender) -
						EMPLOYEE_GENDERS.indexOf(b.gender),
				);
			return { currencyCode: "USD", fxRates, groups };
		});
	}
}
