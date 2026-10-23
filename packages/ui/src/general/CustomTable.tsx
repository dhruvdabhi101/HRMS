import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import PaginationControls from "@repo/ui/general/PaginationControls";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

interface CustomTableProps<TData> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	enableSorting?: boolean;
	enableFiltering?: boolean;
	enablePagination?: boolean;
	className?: string;
	emptyState?: React.ReactNode;

	// State management
	state?: "idle" | "loading" | "error";
	loadingRowCount?: number;
	errorTitle?: string;
	errorDescription?: string;
	errorIcon?: React.ReactNode;

	// Pagination props
	paginationMode?: "client" | "server";
	pageSize?: number;
	totalCount?: number;
	currentPage?: number;
	onPaginationChange?: (page: number, pageSize: number) => void;

	// Sorting props
	sortingMode?: "client" | "server";
	onSortingChange?: (sorting: SortingState) => void;
	sorting?: SortingState;

	// Filtering props
	filteringMode?: "client" | "server";
	onFilteringChange?: (filters: ColumnFiltersState) => void;
	globalFilter?: string;
	onGlobalFilterChange?: (filter: string) => void;
}

export function CustomTable<TData>({
	data,
	columns,
	enableSorting = false,
	enableFiltering = false,
	enablePagination = false,
	className = "",
	emptyState,
	state = "idle",
	loadingRowCount = 5,
	errorTitle = "Failed to load data",
	errorDescription = "An error occurred while loading the data. Please try again.",
	errorIcon,
	paginationMode = "client",
	pageSize = 10,
	totalCount,
	currentPage = 1,
	onPaginationChange,
	sortingMode = "client",
	onSortingChange: externalOnSortingChange,
	sorting: controlledSorting,
	filteringMode = "client",
	onFilteringChange: externalOnFilteringChange,
	globalFilter,
	onGlobalFilterChange,
}: CustomTableProps<TData>) {
	const [internalSorting, setSorting] = React.useState<SortingState>([]);
	const sorting = controlledSorting ?? internalSorting;
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [internalPagination, setPagination] = React.useState<PaginationState>({
		pageIndex: currentPage - 1,
		pageSize,
	});
	const pagination =
		paginationMode === "server"
			? { pageIndex: currentPage - 1, pageSize }
			: internalPagination;

	const handleSortingChange = (
		updaterOrValue: SortingState | ((old: SortingState) => SortingState),
	) => {
		const newSorting =
			typeof updaterOrValue === "function"
				? updaterOrValue(sorting)
				: updaterOrValue;
		setSorting(newSorting);
		if (sortingMode === "server" && externalOnSortingChange) {
			externalOnSortingChange(newSorting);
		}
	};

	const handleFilteringChange = (
		updaterOrValue:
			| ColumnFiltersState
			| ((old: ColumnFiltersState) => ColumnFiltersState),
	) => {
		const newFilters =
			typeof updaterOrValue === "function"
				? updaterOrValue(columnFilters)
				: updaterOrValue;
		setColumnFilters(newFilters);
		if (filteringMode === "server" && externalOnFilteringChange) {
			externalOnFilteringChange(newFilters);
		}
	};

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(enableSorting && {
			getSortedRowModel:
				sortingMode === "client" ? getSortedRowModel() : undefined,
			onSortingChange: handleSortingChange,
			manualSorting: sortingMode === "server",
		}),
		...(enableFiltering && {
			getFilteredRowModel:
				filteringMode === "client" ? getFilteredRowModel() : undefined,
			onColumnFiltersChange: handleFilteringChange,
			manualFiltering: filteringMode === "server",
			...(globalFilter !== undefined && { globalFilter }),
			...(onGlobalFilterChange && { onGlobalFilterChange }),
		}),
		...(enablePagination &&
			paginationMode === "client" && {
				getPaginationRowModel: getPaginationRowModel(),
			}),
		...(enablePagination && {
			onPaginationChange: setPagination,
		}),
		state: {
			sorting,
			columnFilters,
			...(enablePagination && { pagination }),
			...(globalFilter !== undefined && { globalFilter }),
		},
		...(paginationMode === "server" && {
			pageCount: Math.ceil((totalCount ?? 0) / pagination.pageSize),
			manualPagination: true,
		}),
	});

	const handlePageChange = (page: number) => {
		if (paginationMode === "server" && onPaginationChange) {
			onPaginationChange(page, pagination.pageSize);
		} else {
			table.setPageIndex(page - 1);
		}
	};

	const handlePageSizeChange = (newPageSize: number) => {
		if (paginationMode === "server" && onPaginationChange) {
			onPaginationChange(1, newPageSize);
		} else table.setPageSize(newPageSize);
	};

	const pageCount =
		paginationMode === "server"
			? Math.ceil((totalCount ?? 0) / pagination.pageSize)
			: table.getPageCount();

	const renderTableBody = () => {
		if (state === "loading") {
			return (
				<>
					{Array.from({ length: loadingRowCount }).map((_, i) => (
						<TableRow key={`loading-${i}`}>
							{columns.map((_, index) => (
								<TableCell key={`loading-cell-${i}-${index}`}>
									<Skeleton className="h-4 w-full" />
								</TableCell>
							))}
						</TableRow>
					))}
				</>
			);
		}

		if (state === "error") {
			return (
				<TableRow>
					<TableCell colSpan={columns.length} className="h-64">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									{errorIcon || (
										<AlertCircle className="text-destructive h-4 w-4" />
									)}
								</EmptyMedia>
								<EmptyTitle>{errorTitle}</EmptyTitle>
								<EmptyContent>
									<p className="text-muted-foreground text-sm">
										{errorDescription}
									</p>
								</EmptyContent>
							</EmptyHeader>
						</Empty>
					</TableCell>
				</TableRow>
			);
		}

		if (table.getRowModel().rows?.length) {
			return table.getRowModel().rows.map((row) => (
				<TableRow key={row.id}>
					{row.getVisibleCells().map((cell) => (
						<TableCell key={cell.id}>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					))}
				</TableRow>
			));
		}

		return (
			<TableRow>
				<TableCell colSpan={columns.length} className="h-24">
					{emptyState || <div className="text-center">No results.</div>}
				</TableCell>
			</TableRow>
		);
	};

	return (
		<div>
			<div className={`overflow-hidden border ${className}`}>
				<Table>
					<TableHeader className="bg-muted">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										aria-sort={
											header.column.getCanSort() && enableSorting
												? header.column.getIsSorted() === "asc"
													? "ascending"
													: header.column.getIsSorted() === "desc"
														? "descending"
														: "none"
												: undefined
										}
									>
										{header.isPlaceholder ? null : enableSorting &&
											header.column.getCanSort() ? (
											<button
												type="button"
												className="flex cursor-pointer items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-ring"
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												{header.column.getIsSorted() === "asc" ? (
													<ArrowUp aria-hidden="true" className="h-4 w-4" />
												) : header.column.getIsSorted() === "desc" ? (
													<ArrowDown aria-hidden="true" className="h-4 w-4" />
												) : (
													<ArrowUpDown
														aria-hidden="true"
														className="text-muted-foreground h-4 w-4"
													/>
												)}
											</button>
										) : (
											flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>{renderTableBody()}</TableBody>
				</Table>
			</div>

			{enablePagination &&
				pageCount > 0 &&
				state !== "loading" &&
				state !== "error" && (
					<PaginationControls
						currentPage={pagination.pageIndex + 1}
						pageCount={pageCount}
						goToPage={handlePageChange}
						limit={pagination.pageSize}
						setLimit={handlePageSizeChange}
					/>
				)}
		</div>
	);
}
