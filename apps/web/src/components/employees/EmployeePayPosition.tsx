"use client";

import type { EmployeeDetail } from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useState } from "react";
import { usePayDistribution } from "@/queries";
import { employeeComparisonGroups } from "@/utils";
import { EmployeePayPositionView } from "./EmployeePayPosition.view";

export function EmployeePayPosition({
	employee,
}: {
	employee: EmployeeDetail;
}) {
	const groups = employeeComparisonGroups(employee);
	const [selectedFilter, setSelectedFilter] = useState(groups[0].filter);
	const selected =
		groups.find((group) => group.filter === selectedFilter) ?? groups[0];
	const report = usePayDistribution({
		[selected.filter]: selected.value,
		employeeId: employee.id,
		page: 1,
		pageSize: 25,
	});
	return (
		<section aria-label="Pay compared with peers" className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-sm font-medium text-muted-foreground">
					Base salary compared with
				</h3>
				<ToggleGroup
					aria-label="Comparison group"
					variant="outline"
					size="sm"
					spacing={0}
					value={[selected.filter]}
					onValueChange={([filter]) => {
						const next = groups.find((group) => group.filter === filter);
						if (next) setSelectedFilter(next.filter);
					}}
				>
					{groups.map((group) => (
						<ToggleGroupItem
							key={group.filter}
							value={group.filter}
							title={group.valueLabel}
						>
							{group.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
			<div aria-busy={report.isFetching} className="min-h-36">
				{report.isPending || report.isPlaceholderData ? (
					<Skeleton
						role="status"
						aria-label="Loading comparison"
						className="h-36 w-full"
					/>
				) : report.isError ? (
					<div className="space-y-3">
						<AlertMessage
							variant="destructive"
							message={report.error.message}
						/>
						<LoadingButton
							variant="outline"
							size="sm"
							isLoading={report.isFetching}
							onClick={() => report.refetch()}
						>
							Retry
						</LoadingButton>
					</div>
				) : (
					<EmployeePayPositionView
						report={report.data}
						groupLabel={selected.valueLabel}
					/>
				)}
			</div>
		</section>
	);
}
