import type {
	EmployeePayPosition,
	PayDistributionSummary,
	PayOutlier,
} from "@repo/shared";
import { ChartContainer } from "@repo/ui/components/chart";
import {
	ComposedChart,
	ReferenceArea,
	ReferenceDot,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";
import { formatEmployeeMoney } from "@/utils";

export function PayBoxPlot({
	summary,
	employee,
	outliers,
}: {
	summary: PayDistributionSummary;
	employee: EmployeePayPosition | null;
	outliers: PayOutlier[];
}) {
	const min = Math.min(summary.min, employee?.annualBaseUsd ?? summary.min);
	const max = Math.max(summary.max, employee?.annualBaseUsd ?? summary.max);
	const padding = Math.max((max - min) * 0.08, 1);
	const bounds = [Math.max(0, min - padding), max + padding];
	const values = [
		["Minimum", summary.min],
		["Q1", summary.q1],
		["Median", summary.median],
		["Average (mean)", summary.average],
		["Q3", summary.q3],
		["Maximum", summary.max],
	] as const;
	return (
		<div className="space-y-4 rounded-lg border p-4">
			<p className="text-sm text-muted-foreground">
				Annual base salary in USD. Box: middle 50%. Solid whiskers: inlier
				range. Faint line: full min–max range. Dashed line: average. Orange dot:
				selected employee.
			</p>
			<div
				role="img"
				aria-label={`Box plot: minimum ${formatEmployeeMoney(summary.min, "USD")}, median ${formatEmployeeMoney(summary.median, "USD")}, average ${formatEmployeeMoney(summary.average, "USD")}, maximum ${formatEmployeeMoney(summary.max, "USD")}${employee ? `; employee ${formatEmployeeMoney(employee.annualBaseUsd, "USD")}` : ""}`}
			>
				<ChartContainer
					config={{
						cohort: { label: "Comparison group", color: "var(--chart-1)" },
					}}
					className="h-52 w-full aspect-auto"
				>
					<ComposedChart
						data={[
							{ pay: bounds[0], row: 0 },
							{ pay: bounds[1], row: 2 },
						]}
						margin={{ top: 20, bottom: 12, left: 20, right: 20 }}
					>
						<XAxis
							type="number"
							dataKey="pay"
							domain={bounds}
							tickFormatter={(value) =>
								new Intl.NumberFormat("en-US", { notation: "compact" }).format(
									value / 100,
								)
							}
						/>
						<YAxis type="number" dataKey="row" domain={[0, 2]} hide />
						<ReferenceLine
							segment={[
								{ x: summary.min, y: 1 },
								{ x: summary.max, y: 1 },
							]}
							stroke="currentColor"
							strokeOpacity={0.25}
						/>
						<ReferenceLine
							segment={[
								{ x: summary.lowerWhisker, y: 1 },
								{ x: summary.upperWhisker, y: 1 },
							]}
							stroke="var(--chart-1)"
							strokeWidth={3}
						/>
						{[summary.lowerWhisker, summary.upperWhisker].map(
							(value, index) => (
								<ReferenceLine
									key={index}
									segment={[
										{ x: value, y: 0.8 },
										{ x: value, y: 1.2 },
									]}
									stroke="var(--chart-1)"
									strokeWidth={2}
								/>
							),
						)}
						<ReferenceArea
							x1={summary.q1}
							x2={summary.q3}
							y1={0.65}
							y2={1.35}
							fill="var(--chart-1)"
							fillOpacity={0.25}
							stroke="var(--chart-1)"
						/>
						<ReferenceLine
							segment={[
								{ x: summary.median, y: 0.65 },
								{ x: summary.median, y: 1.35 },
							]}
							stroke="var(--chart-1)"
							strokeWidth={3}
						/>
						<ReferenceLine
							x={summary.average}
							stroke="currentColor"
							strokeDasharray="5 5"
						/>
						{outliers.map((outlier) => (
							<ReferenceDot
								key={outlier.id}
								x={outlier.annualBaseUsd}
								y={1}
								r={4}
								fill="var(--destructive)"
								stroke="var(--background)"
							/>
						))}
						{employee && (
							<ReferenceDot
								x={employee.annualBaseUsd}
								y={1.65}
								r={7}
								fill="#f97316"
								stroke="currentColor"
							/>
						)}
					</ComposedChart>
				</ChartContainer>
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
