"use client";

import { buttonVariants } from "@repo/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import Link from "next/link";
import { PayDistributionPanel } from "@/components/insights/PayDistributionPanel";
import { useBreadcrumbLabel } from "@/hooks/use-breadcrumb-label";
import { ApiError } from "@/lib/api-error";
import { useEmployee } from "@/queries";
import { CompensationHistoryView } from "./CompensationHistory.view";
import { EmployeeForm } from "./EmployeeForm";
import { EmployeeSummaryView } from "./EmployeeSummary.view";
import { TerminateEmployee } from "./TerminateEmployee";

export function EmployeeDetail({
	employeeId,
	edit = false,
}: {
	employeeId: string;
	edit?: boolean;
}) {
	const { data, isPending, isFetching, isError, error, refetch } = useEmployee(
		employeeId,
		edit,
	);
	useBreadcrumbLabel(
		employeeId,
		data?.name ?? (isError ? "Employee" : undefined),
	);
	if (isPending || (edit && isFetching))
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
						<LoadingButton
							variant="outline"
							isLoading={isFetching}
							onClick={() => void refetch()}
						>
							Try again
						</LoadingButton>
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
	if (edit && data.status === "active")
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-semibold">Edit employee</h1>
				<EmployeeForm key={data.id} employee={data} />
			</div>
		);

	return (
		<div className="space-y-6">
			<EmployeeSummaryView employee={data} />
			{data.status === "active" ? (
				<div className="flex flex-wrap gap-3">
					<Link
						href={`/employees/${data.id}/edit`}
						className={buttonVariants({ variant: "outline" })}
					>
						Edit employee
					</Link>
					<TerminateEmployee employee={data} />
				</div>
			) : (
				<AlertMessage message="This employee is terminated. Their record and compensation history are read-only." />
			)}
			<PayDistributionPanel key={data.id} employee={data} />
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
