import { PAY_METRIC_LABELS, type PayGroupsResponse } from "@repo/shared";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatPayValue, payDimensionValue } from "@/utils";

export function PayGroupsChart({ report }: { report: PayGroupsResponse }) {
	const label = PAY_METRIC_LABELS[report.metric];
	const data = [...report.groups]
		.sort((a, b) => b.value - a.value)
		.slice(0, 20)
		.map((group) => ({
			label: report.dimensions
				.map((dimension) => payDimensionValue(group, dimension))
				.join(" / "),
			value: group.value,
		}));
	return (
		<div className="space-y-3 rounded-lg border p-4">
			<h3 className="font-medium">
				{label}
				{report.metric === "headcount" ? "" : " (USD)"}
			</h3>
			<p className="text-sm text-muted-foreground">
				{report.groups.length > 20
					? "Chart shows the 20 largest values. The table includes every group."
					: "All matching groups."}{" "}
				Hover or focus a bar for its full label and exact value.
			</p>
			<ChartContainer
				config={{ value: { label, color: "var(--chart-1)" } }}
				className="h-96 w-full aspect-auto"
			>
				<BarChart
					accessibilityLayer
					data={data}
					margin={{ bottom: 32, left: 12, right: 12 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="label"
						interval={0}
						tickFormatter={(value) =>
							String(value).length > 16
								? `${String(value).slice(0, 14)}…`
								: value
						}
						angle={-30}
						textAnchor="end"
						height={75}
					/>
					<YAxis
						width={70}
						allowDecimals={report.metric !== "headcount"}
						tickFormatter={(value) =>
							new Intl.NumberFormat("en-US", { notation: "compact" }).format(
								report.metric === "headcount" ? value : value / 100,
							)
						}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value) =>
									formatPayValue(Number(value), report.metric)
								}
							/>
						}
					/>
					<Bar
						dataKey="value"
						fill="var(--color-value)"
						radius={[4, 4, 0, 0]}
						isAnimationActive={false}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
