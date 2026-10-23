import type { PayDistributionSummary, PayOutlier } from "@repo/shared";
import { ChartContainer } from "@repo/ui/components/chart";
import { cn } from "@repo/ui/lib/utils";
import {
	ComposedChart,
	ReferenceArea,
	ReferenceDot,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

const formatCompactUsd = (minor: number) =>
	new Intl.NumberFormat("en-US", { notation: "compact" }).format(minor / 100);

export function PayBoxPlotChart({
	summary,
	markerUsd,
	outliers = [],
	className,
}: {
	summary: PayDistributionSummary;
	markerUsd?: number;
	outliers?: PayOutlier[];
	className?: string;
}) {
	const min = Math.min(summary.min, markerUsd ?? summary.min);
	const max = Math.max(summary.max, markerUsd ?? summary.max);
	const padding = Math.max((max - min) * 0.08, 1);
	const bounds = [Math.max(0, min - padding), max + padding];
	return (
		<ChartContainer
			config={{
				cohort: { label: "Comparison group", color: "var(--chart-1)" },
			}}
			className={cn("aspect-auto w-full", className)}
		>
			<ComposedChart
				data={[
					{ pay: bounds[0], row: 0 },
					{ pay: bounds[1], row: 2 },
				]}
				margin={{ top: 8, bottom: 4, left: 12, right: 12 }}
			>
				<XAxis
					type="number"
					dataKey="pay"
					domain={bounds}
					tickFormatter={formatCompactUsd}
					tickLine={false}
					axisLine={false}
				/>
				<YAxis type="number" dataKey="row" domain={[0, 2]} hide />
				<ReferenceLine
					segment={[
						{ x: summary.min, y: 1 },
						{ x: summary.max, y: 1 },
					]}
					stroke="currentColor"
					strokeOpacity={0.2}
				/>
				<ReferenceLine
					segment={[
						{ x: summary.lowerWhisker, y: 1 },
						{ x: summary.upperWhisker, y: 1 },
					]}
					stroke="var(--chart-1)"
					strokeWidth={2}
				/>
				{[summary.lowerWhisker, summary.upperWhisker].map((value, index) => (
					<ReferenceLine
						key={index}
						segment={[
							{ x: value, y: 0.8 },
							{ x: value, y: 1.2 },
						]}
						stroke="var(--chart-1)"
						strokeWidth={2}
					/>
				))}
				<ReferenceArea
					x1={summary.q1}
					x2={summary.q3}
					y1={0.6}
					y2={1.4}
					radius={4}
					fill="var(--chart-1)"
					fillOpacity={0.2}
					stroke="var(--chart-1)"
				/>
				<ReferenceLine
					segment={[
						{ x: summary.median, y: 0.6 },
						{ x: summary.median, y: 1.4 },
					]}
					stroke="var(--chart-1)"
					strokeWidth={3}
				/>
				<ReferenceLine
					segment={[
						{ x: summary.average, y: 0.3 },
						{ x: summary.average, y: 1.7 },
					]}
					stroke="currentColor"
					strokeOpacity={0.5}
					strokeDasharray="3 3"
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
				{markerUsd !== undefined && (
					<ReferenceDot
						x={markerUsd}
						y={1}
						r={7}
						fill="#f97316"
						stroke="var(--background)"
						strokeWidth={2}
					/>
				)}
			</ComposedChart>
		</ChartContainer>
	);
}
