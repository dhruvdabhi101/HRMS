import {
	EMPLOYEE_GENDERS,
	type GenderPayGroup,
	type GenderPayResponse,
} from "@repo/shared";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import { CustomTable } from "@repo/ui/general/CustomTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatEmployeeMoney } from "@/utils";
import { PayFxBasis } from "./PayFxBasis.view";

const genderLabels = {
	woman: "Women",
	man: "Men",
	non_binary: "Non-binary",
	undisclosed: "Undisclosed",
};
const chartConfig = Object.fromEntries(
	EMPLOYEE_GENDERS.map((gender, index) => [
		gender,
		{ label: genderLabels[gender], color: `var(--chart-${index + 1})` },
	]),
);
export function GenderPayResults({ report }: { report: GenderPayResponse }) {
	const columns: ColumnDef<GenderPayGroup, unknown>[] = [
		{ accessorKey: "level", header: "Level" },
		...EMPLOYEE_GENDERS.map((gender) => ({
			id: gender,
			header: `${genderLabels[gender]}: median / count`,
			cell: ({ row }: { row: { original: GenderPayGroup } }) => {
				const group = row.original.genders.find(
					(item) => item.gender === gender,
				);
				return group
					? `${formatEmployeeMoney(group.median, "USD")} / ${group.headcount}`
					: "Not available / 0";
			},
		})),
		{
			accessorKey: "gapPercent",
			header: "Women's median relative to men's median",
			cell: ({ row }) =>
				row.original.gapPercent === null
					? "Not available"
					: `${row.original.gapPercent.toFixed(2)}%`,
		},
		{
			accessorKey: "smallSample",
			header: "Sample note",
			cell: ({ row }) =>
				row.original.smallSample ? "Women or men below 5" : "—",
		},
	];
	const data = report.groups.map((group) => ({
		level: group.level,
		...Object.fromEntries(
			EMPLOYEE_GENDERS.map((gender) => [
				gender,
				group.genders.find((item) => item.gender === gender)?.median ?? null,
			]),
		),
	}));
	return (
		<div className="space-y-5">
			<p className="text-sm text-muted-foreground">
				Median annual base in USD within each level · Active employees only.
				Counts are shown for every gender. Positive percentages mean women's
				median is lower; negative means higher. This describes a difference and
				is not an adjusted equal-pay conclusion.
			</p>
			<p className="text-sm text-muted-foreground">
				Gap = (men's median − women's median) ÷ men's median × 100, using
				unrounded medians. Not available if either group is missing or men's
				median is zero. Interpret groups below five employees cautiously.
			</p>
			<PayFxBasis rates={report.fxRates} />
			<CustomTable data={report.groups} columns={columns} />
			<ChartContainer config={chartConfig} className="h-96 w-full aspect-auto">
				<BarChart
					accessibilityLayer
					data={data}
					margin={{ left: 12, right: 12 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis dataKey="level" />
					<YAxis
						width={75}
						tickFormatter={(value) =>
							new Intl.NumberFormat("en-US", { notation: "compact" }).format(
								value / 100,
							)
						}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value, name) =>
									`${genderLabels[name as keyof typeof genderLabels]}: ${formatEmployeeMoney(Number(value), "USD")}`
								}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent />} />
					{EMPLOYEE_GENDERS.map((gender) => (
						<Bar
							key={gender}
							dataKey={gender}
							fill={`var(--color-${gender})`}
							radius={[4, 4, 0, 0]}
							isAnimationActive={false}
						/>
					))}
				</BarChart>
			</ChartContainer>
		</div>
	);
}
