import type { PayDistributionResponse } from "@repo/shared";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@repo/ui/components/empty";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { CustomTable } from "@repo/ui/general/CustomTable";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { formatEmployeeMoney } from "@/utils";
import { PayBoxPlot } from "./PayBoxPlot.view";
import { PayFxBasis } from "./PayFxBasis.view";

const columns: ColumnDef<
	PayDistributionResponse["outliers"]["items"][number],
	unknown
>[] = [
	{
		accessorKey: "name",
		header: "Employee",
		cell: ({ row }) => (
			<Link
				className="underline underline-offset-4"
				href={`/employees/${encodeURIComponent(row.original.id)}`}
			>
				{row.original.name}
			</Link>
		),
	},
	{
		accessorKey: "annualBaseUsd",
		header: "Annual base (USD)",
		cell: ({ row }) => formatEmployeeMoney(row.original.annualBaseUsd, "USD"),
	},
];
export function PayDistributionResults({
	report,
	onPageChange,
}: {
	report: PayDistributionResponse;
	onPageChange: (page: number, pageSize: number) => void;
}) {
	const { summary, outliers } = report;
	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Active employees only · Annual base salary in USD
				{summary
					? ` · ${summary.headcount.toLocaleString("en-US")} employees`
					: ""}
				.
			</p>
			<PayFxBasis rates={report.fxRates} />
			{!summary ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No active employees match</EmptyTitle>
						<EmptyDescription>
							Change the filters to build a comparison group.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<>
					{summary.smallSample && (
						<AlertMessage message="Fewer than four employees: summary values are shown, but outlier labels are suppressed." />
					)}
					<PayBoxPlot summary={summary} outliers={outliers.items} />
					{!summary.smallSample && (
						<section className="space-y-3">
							<h3 className="font-medium">
								Outliers ({outliers.totalCount.toLocaleString("en-US")})
							</h3>
							<p className="text-sm text-muted-foreground">
								Strictly below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR, using
								unrounded quartiles.
							</p>
							<CustomTable
								data={outliers.items}
								columns={columns}
								enablePagination
								paginationMode="server"
								currentPage={outliers.page}
								pageSize={outliers.pageSize}
								totalCount={outliers.totalCount}
								onPaginationChange={onPageChange}
								emptyState={
									<Empty>
										<EmptyHeader>
											<EmptyTitle>No outliers in this group</EmptyTitle>
										</EmptyHeader>
									</Empty>
								}
							/>
						</section>
					)}
				</>
			)}
		</div>
	);
}
