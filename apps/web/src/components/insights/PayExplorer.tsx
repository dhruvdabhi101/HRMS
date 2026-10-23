"use client";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { PageContainer } from "@repo/ui/general/PageContainer";
import { usePayExplorer } from "@/hooks";
import { PayExplorerControls } from "./PayExplorerControls";
import { PayGroupsResults } from "./PayGroupsResults.view";

export function PayExplorer() {
	const explorer = usePayExplorer();
	const { report } = explorer;
	return (
		<PageContainer className="min-w-0 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Pay explorer</h1>
				<p className="text-muted-foreground">
					Compare pay across countries, departments, levels and job titles.
				</p>
			</div>
			<PayExplorerControls explorer={explorer} />
			<section
				className="min-w-0"
				aria-label="Pay report"
				aria-busy={report.isPending || report.isFetching}
			>
				{report.isPending || report.isFetching ? (
					<div className="space-y-3" role="status">
						<p className="text-sm text-muted-foreground">Loading report…</p>
						<Skeleton className="h-12" />
						<Skeleton className="h-72" />
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
							Retry report
						</LoadingButton>
					</div>
				) : !report.data?.groups.length ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No active employees match</EmptyTitle>
							<EmptyDescription>
								Change the filters and update the report.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<PayGroupsResults
						key={JSON.stringify(explorer.query)}
						report={report.data}
					/>
				)}
			</section>
		</PageContainer>
	);
}
