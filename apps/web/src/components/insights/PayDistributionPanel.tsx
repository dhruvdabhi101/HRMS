"use client";

import type {
	EmployeeDetail,
	PayDistributionQuery,
	PayFilters,
} from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { INSIGHT_KEYS, usePayDistribution } from "@/queries";
import { PayDistributionResults } from "./PayDistributionResults.view";
import { PayFiltersForm } from "./PayFiltersForm";

export function PayDistributionPanel({
	employee,
}: {
	employee?: EmployeeDetail;
}) {
	const cache = useQueryClient();
	const [query, setQuery] = useState<PayDistributionQuery>({
		countryCode: employee?.countryCode,
		employeeId: employee?.id,
		page: 1,
		pageSize: 25,
	});
	const report = usePayDistribution(query);
	const loading = report.isPending || report.isFetching;
	const apply = (filters: PayFilters) => {
		const next = {
			...filters,
			employeeId: employee?.id,
			page: 1,
			pageSize: query.pageSize,
		};
		cache.invalidateQueries({
			queryKey: INSIGHT_KEYS.distribution(next),
			exact: true,
		});
		setQuery(next);
	};
	return (
		<section
			className="space-y-4"
			aria-label={employee ? "Employee pay position" : "Pay distribution"}
		>
			<h2 className="text-xl font-semibold">
				{employee ? "Pay position" : "Salary spread"}
			</h2>
			<PayFiltersForm
				initialCountry={employee?.countryCode}
				isLoading={loading}
				onApply={apply}
			/>
			<div aria-busy={loading}>
				{loading ? (
					<div className="space-y-3" role="status">
						<p className="text-sm text-muted-foreground">Loading comparison…</p>
						<Skeleton className="h-64 w-full" />
					</div>
				) : report.isError ? (
					<div className="space-y-3">
						<AlertMessage
							variant="destructive"
							message={report.error.message}
						/>
						<LoadingButton
							variant="outline"
							isLoading={report.isFetching}
							onClick={() => report.refetch()}
						>
							Retry comparison
						</LoadingButton>
					</div>
				) : (
					report.data && (
						<PayDistributionResults
							report={report.data}
							onPageChange={(page, pageSize) =>
								setQuery((current) => ({ ...current, page, pageSize }))
							}
						/>
					)
				)}
			</div>
		</section>
	);
}
