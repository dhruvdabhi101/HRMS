"use client";

import { buttonVariants } from "@repo/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { CustomTable } from "@repo/ui/general/CustomTable";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { PageContainer } from "@repo/ui/general/PageContainer";
import Link from "next/link";
import { useEmployeeDirectory } from "@/hooks";
import { EmployeeDirectoryFilters } from "./EmployeeDirectoryFilters";
import { ExportEmployees } from "./ExportEmployees";
import { employeeDirectoryColumns } from "./employee-directory-columns";

export function EmployeeDirectory() {
	const {
		query,
		search,
		setSearch,
		employees,
		changeFilter,
		changeSorting,
		changePage,
		clearFilters,
	} = useEmployeeDirectory();
	const { data, isLoading, isError, error, refetch } = employees;
	return (
		<PageContainer className="flex h-[calc(100dvh-4rem)] min-h-[36rem] min-w-0 max-w-none flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Employees</h1>
					<p className="text-muted-foreground">
						Find employees and review their compensation.
					</p>
				</div>
				<div className="flex flex-wrap items-start gap-3">
					<ExportEmployees
						query={query}
						disabled={
							isLoading ||
							isError ||
							employees.isFetching ||
							search.trim() !== (query.search ?? "")
						}
					/>
					<Link href="/employees/new" className={buttonVariants()}>
						Add employee
					</Link>
				</div>
			</div>
			<EmployeeDirectoryFilters
				query={query}
				search={search}
				onSearch={setSearch}
				onFilter={changeFilter}
				onClear={clearFilters}
			/>
			<div className="flex min-h-0 flex-1 flex-col gap-3" aria-busy={isLoading}>
				<p className="text-muted-foreground text-sm" role="status">
					{isLoading
						? "Loading employees…"
						: isError
							? "Employees could not be loaded."
							: `${data?.totalCount.toLocaleString("en-US") ?? 0} employees · Page ${data?.page ?? 1}`}
				</p>
				<CustomTable
					data={data?.items ?? []}
					columns={employeeDirectoryColumns}
					enableSorting
					enablePagination
					scrollable
					sortingMode="server"
					paginationMode="server"
					currentPage={query.page}
					pageSize={query.pageSize}
					totalCount={data?.totalCount ?? 0}
					sorting={[
						{
							id: query.sortBy ?? "name",
							desc: query.sortDirection === "desc",
						},
					]}
					onSortingChange={changeSorting}
					onPaginationChange={changePage}
					state={isLoading ? "loading" : isError ? "error" : "idle"}
					errorDescription={error?.message}
					emptyState={
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No employees found</EmptyTitle>
								<EmptyDescription>
									Try a different name or clear your filters.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					}
				/>
				{isError && (
					<LoadingButton
						variant="outline"
						isLoading={employees.isFetching}
						onClick={() => refetch()}
					>
						Retry employees
					</LoadingButton>
				)}
			</div>
		</PageContainer>
	);
}
