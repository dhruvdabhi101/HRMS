"use client";

import type { EmployeeDirectoryQuery } from "@repo/shared";
import type { SortingState } from "@tanstack/react-table";
import { useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { employeeDirectorySearchParams } from "@/lib/employee-directory-search-params";
import { useEmployees } from "@/queries";

export function useEmployeeDirectory() {
	const [urlQuery, setQuery] = useQueryStates(employeeDirectorySearchParams);
	const search = urlQuery.search;
	const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(timer);
	}, [search]);
	const query: EmployeeDirectoryQuery = {
		...urlQuery,
		search: debouncedSearch || undefined,
		countryCode: urlQuery.countryCode ?? undefined,
		department: urlQuery.department ?? undefined,
		jobTitle: urlQuery.jobTitle ?? undefined,
		level: urlQuery.level ?? undefined,
	};
	const employees = useEmployees(query, search.trim() === debouncedSearch);
	const setSearch = (value: string) =>
		setQuery({ search: value || null, page: 1 });
	const changeFilter = (filter: Partial<EmployeeDirectoryQuery>) =>
		setQuery({
			...Object.fromEntries(
				Object.entries(filter).map(([key, value]) => [key, value ?? null]),
			),
			page: 1,
		});
	const changeSorting = (sorting: SortingState) =>
		changeFilter({
			sortBy: (sorting[0]?.id ?? "name") as EmployeeDirectoryQuery["sortBy"],
			sortDirection: sorting[0]?.desc ? "desc" : "asc",
		});
	const changePage = (page: number, pageSize: number) =>
		setQuery({ page, pageSize });
	const clearFilters = () => {
		setDebouncedSearch("");
		return setQuery({
			page: 1,
			search: null,
			countryCode: null,
			department: null,
			jobTitle: null,
			level: null,
			status: null,
		});
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
