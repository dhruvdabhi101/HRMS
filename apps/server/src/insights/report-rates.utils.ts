import { ServiceUnavailableException } from "@nestjs/common";
import { Prisma } from "@repo/db";
import type { PayFxRate } from "@repo/shared";

export async function readReportRates(
	tx: Prisma.TransactionClient,
): Promise<PayFxRate[]> {
	const rates = await tx.fxRate.findMany({ orderBy: { currencyCode: "asc" } });
	if (
		rates.some(
			(rate) =>
				!Number.isSafeInteger(rate.usdRateMicros) || rate.usdRateMicros <= 0,
		)
	)
		throw new ServiceUnavailableException(
			"Reports require positive fixed FX rates.",
		);
	return rates.map((rate) => ({
		currencyCode: rate.currencyCode,
		usdRateMicros: rate.usdRateMicros,
		asOfDate: rate.asOfDate.toISOString().slice(0, 10),
	}));
}
