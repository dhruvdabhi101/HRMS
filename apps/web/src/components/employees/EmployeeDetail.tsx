"use client";

import { Button, buttonVariants } from "@repo/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import Link from "next/link";
import { useBreadcrumbLabel } from "@/hooks/use-breadcrumb-label";
import { ApiError } from "@/lib/api-error";
import { useEmployee } from "@/queries";
import { CompensationHistoryView } from "./CompensationHistory.view";
import { EmployeeSummaryView } from "./EmployeeSummary.view";

export function EmployeeDetail({ employeeId }: { employeeId: string }) {
	const { data, isPending, isError, error, refetch } = useEmployee(employeeId);
	useBreadcrumbLabel(
		employeeId,
		data?.name ?? (isError ? "Employee" : undefined),
	);
	if (isPending)
		return (
			<div aria-label="Loading employee" role="status" className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	if (isError)
		return (
			<div className="space-y-4">
				{error instanceof ApiError && error.status === 404 ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>Employee not found</EmptyTitle>
						</EmptyHeader>
					</Empty>
				) : (
					<>
						<div role="alert">
							<AlertMessage variant="destructive" message={error.message} />
						</div>
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</>
				)}
				<Link href="/employees/new" className={buttonVariants()}>
					Add employee
				</Link>
			</div>
		);
	if (!data)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No employee data</EmptyTitle>
				</EmptyHeader>
			</Empty>
		);
	return (
		<div className="space-y-6">
			<EmployeeSummaryView employee={data} />
			<CompensationHistoryView changes={data.compensationChanges} />
			<Link
				href="/employees/new"
				className={buttonVariants({ variant: "outline" })}
			>
				Add another employee
			</Link>
		</div>
	);
}
