import type { PayDistributionResponse } from "@repo/shared";
import { PayBoxPlotChart } from "@/components/insights/PayBoxPlotChart.view";
import { describeMedianPosition, formatEmployeeMoney } from "@/utils";

export function EmployeePayPositionView({
	report,
	groupLabel,
}: {
	report: PayDistributionResponse;
	groupLabel: string;
}) {
	const { summary, employee } = report;
	if (!summary || !employee)
		return (
			<p className="py-6 text-center text-sm text-muted-foreground">
				No active employees to compare with in {groupLabel}.
			</p>
		);
	const range = [
		["Min", summary.min],
		["Median", summary.median],
		["Max", summary.max],
	] as const;
	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<p className="font-medium">
					{describeMedianPosition(employee.annualBaseUsd, summary.median)}
				</p>
				<p className="text-xs text-muted-foreground">
					{summary.headcount.toLocaleString("en-US")} active in {groupLabel}
					{" · USD"}
				</p>
			</div>
			<div
				role="img"
				aria-label={`Annual base ${formatEmployeeMoney(employee.annualBaseUsd, "USD")} compared with ${groupLabel}: minimum ${formatEmployeeMoney(summary.min, "USD")}, median ${formatEmployeeMoney(summary.median, "USD")}, maximum ${formatEmployeeMoney(summary.max, "USD")}`}
			>
				<PayBoxPlotChart
					summary={summary}
					markerUsd={employee.annualBaseUsd}
					className="h-20"
				/>
			</div>
			<dl className="flex justify-between gap-4 text-xs">
				{range.map(([label, value]) => (
					<div
						key={label}
						className="last:text-right [&:nth-child(2)]:text-center"
					>
						<dt className="text-muted-foreground">{label}</dt>
						<dd className="font-medium tabular-nums">
							{formatEmployeeMoney(value, "USD")}
						</dd>
					</div>
				))}
			</dl>
			{employee.status === "terminated" && (
				<p className="text-xs text-muted-foreground">
					Terminated employees are not counted in the group. The orange dot
					shows their last salary.
				</p>
			)}
		</div>
	);
}
