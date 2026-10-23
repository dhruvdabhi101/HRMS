import type { PayFxRate } from "@repo/shared";

export function PayFxBasis({ rates }: { rates: PayFxRate[] }) {
	return (
		<p className="text-sm text-muted-foreground">
			Synthetic fixed FX rates · USD per local unit ·{" "}
			{rates
				.map(
					(rate) =>
						`${rate.currencyCode} ${(rate.usdRateMicros / 1_000_000).toFixed(6)} (${rate.asOfDate})`,
				)
				.join(" · ")}
		</p>
	);
}
