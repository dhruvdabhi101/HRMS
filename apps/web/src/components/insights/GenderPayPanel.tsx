"use client";

import type { PayFilters } from "@repo/shared";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { INSIGHT_KEYS, useGenderPay } from "@/queries";
import { GenderPayResults } from "./GenderPayResults.view";
import { PayFiltersForm } from "./PayFiltersForm";

export function GenderPayPanel() {
	const cache = useQueryClient();
	const [query, setQuery] = useState<PayFilters>({});
	const report = useGenderPay(query);
	const loading = report.isPending || report.isFetching;
	const apply = (filters: PayFilters) => {
		cache.invalidateQueries({
			queryKey: INSIGHT_KEYS.gender(filters),
			exact: true,
		});
		setQuery(filters);
	};
	return (
		<div className="space-y-5">
			<PayFiltersForm isLoading={loading} onApply={apply} />
			<section aria-label="Gender pay report" aria-busy={loading}>
				{loading ? (
					<div role="status" className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Loading gender comparison…
						</p>
						<Skeleton className="h-64" />
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
				) : !report.data?.groups.length ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No active employees match</EmptyTitle>
							<EmptyDescription>
								Change the filters to compare pay.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<GenderPayResults report={report.data} />
				)}
			</section>
		</div>
	);
}
