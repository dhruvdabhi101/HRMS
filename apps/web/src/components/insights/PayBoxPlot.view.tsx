import type { PayDistributionSummary, PayOutlier } from "@repo/shared";
import { formatEmployeeMoney } from "@/utils";
import { PayBoxPlotChart } from "./PayBoxPlotChart.view";

export function PayBoxPlot({
	summary,
	outliers,
}: {
	summary: PayDistributionSummary;
	outliers: PayOutlier[];
}) {
	const values = [
		["Minimum", summary.min],
		["Q1", summary.q1],
		["Median", summary.median],
		["Average (mean)", summary.average],
		["Q3", summary.q3],
		["Maximum", summary.max],
	] as const;
	return (
		<div className="space-y-4 rounded-xl p-4 ring-1 ring-foreground/10">
			<p className="text-sm text-muted-foreground">
				Annual base salary in USD. Box: middle 50%. Solid whiskers: inlier
				range. Faint line: full min–max range. Dashed line: average.
			</p>
			<div
				role="img"
				aria-label={`Box plot: minimum ${formatEmployeeMoney(summary.min, "USD")}, median ${formatEmployeeMoney(summary.median, "USD")}, average ${formatEmployeeMoney(summary.average, "USD")}, maximum ${formatEmployeeMoney(summary.max, "USD")}`}
			>
				<PayBoxPlotChart
					summary={summary}
					outliers={outliers}
					className="h-40"
				/>
			</div>
			<dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
				{values.map(([label, value]) => (
					<div key={label}>
						<dt className="text-muted-foreground">{label}</dt>
						<dd className="font-medium tabular-nums">
							{formatEmployeeMoney(value, "USD")}
						</dd>
					</div>
				))}
			</dl>
			{outliers.length > 0 && (
				<p className="text-xs text-muted-foreground">
					Red points show the current page of outliers; the full min/max range
					always includes every matching employee.
				</p>
			)}
		</div>
	);
}
