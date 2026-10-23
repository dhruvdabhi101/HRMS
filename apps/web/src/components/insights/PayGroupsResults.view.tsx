import {
	PAY_DIMENSION_LABELS,
	PAY_METRIC_LABELS,
	type PayGroup,
	type PayGroupsResponse,
} from "@repo/shared";
import { CustomTable } from "@repo/ui/general/CustomTable";
import type { ColumnDef } from "@tanstack/react-table";
import { formatPayValue, payDimensionValue } from "@/utils";
import { PayGroupsChart } from "./PayGroupsChart.view";

export function PayGroupsResults({ report }: { report: PayGroupsResponse }) {
	const columns: ColumnDef<PayGroup, unknown>[] = report.dimensions.map(
		(dimension) => ({
			id: dimension,
			header: PAY_DIMENSION_LABELS[dimension],
			accessorFn: (group) => payDimensionValue(group, dimension),
		}),
	);
	if (report.metric !== "headcount")
		columns.push({ accessorKey: "headcount", header: "Employees" });
	columns.push({
		accessorKey: "value",
		header: `${PAY_METRIC_LABELS[report.metric]}${report.metric === "headcount" ? "" : " (USD)"}`,
		cell: ({ row }) => formatPayValue(row.original.value, report.metric),
	});
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-lg font-semibold">
					{PAY_METRIC_LABELS[report.metric]} by{" "}
					{report.dimensions
						.map((dimension) => PAY_DIMENSION_LABELS[dimension].toLowerCase())
						.join(" and ")}
				</h2>
				<p className="text-sm text-muted-foreground">
					Active employees only. Pay statistics use annual base salary. Annual
					target compensation includes target bonus; excludes taxes, benefits
					and actual payouts.
				</p>
				<p className="text-sm text-muted-foreground">
					Synthetic fixed FX rates · USD per local unit ·{" "}
					{report.fxRates
						.map(
							(rate) =>
								`${rate.currencyCode} ${(rate.usdRateMicros / 1_000_000).toFixed(6)} (${rate.asOfDate})`,
						)
						.join(" · ")}
				</p>
			</div>
			<CustomTable
				data={report.groups}
				columns={columns}
				enableSorting
				enablePagination
				pageSize={25}
			/>
			<PayGroupsChart report={report} />
		</div>
	);
}
