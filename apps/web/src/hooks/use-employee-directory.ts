"use client";

import type { EmployeeDirectoryQuery } from "@repo/shared";
import type { SortingState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useEmployees } from "@/queries";

export function useEmployeeDirectory() {
	const [query, setQuery] = useState<EmployeeDirectoryQuery>({
		page: 1,
		pageSize: 25,
		status: "active",
		sortBy: "name",
		sortDirection: "asc",
	});
	const [search, setSearch] = useState("");
	useEffect(() => {
		const timer = setTimeout(
			() =>
				setQuery((current) =>
					(current.search ?? "") === search.trim()
						? current
						: { ...current, search: search.trim(), page: 1 },
				),
			300,
		);
		return () => clearTimeout(timer);
	}, [search]);
	const employees = useEmployees(query);
	const changeFilter = (filter: Partial<EmployeeDirectoryQuery>) =>
		setQuery((current) => ({ ...current, ...filter, page: 1 }));
	const changeSorting = (sorting: SortingState) =>
		changeFilter({
			sortBy: (sorting[0]?.id ?? "name") as EmployeeDirectoryQuery["sortBy"],
			sortDirection: sorting[0]?.desc ? "desc" : "asc",
		});
	const changePage = (page: number, pageSize: number) =>
		setQuery((current) => ({ ...current, page, pageSize }));
	const clearFilters = () => {
		setSearch("");
		setQuery((current) => ({
			page: 1,
			pageSize: current.pageSize,
			status: "active",
			sortBy: current.sortBy,
			sortDirection: current.sortDirection,
		}));
	};
	return {
		query,
		search,
		setSearch,
		employees,
		changeFilter,
		changeSorting,
		changePage,
		clearFilters,
	};
}
