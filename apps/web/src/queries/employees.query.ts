import type { EmployeeDirectoryQuery } from "@repo/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EmployeesService } from "@/services";

export const EMPLOYEE_KEYS = {
	all: ["employees"] as const,
	detail: (id: string) => ["employees", "detail", id] as const,
	list: (query: EmployeeDirectoryQuery) =>
		["employees", "list", query] as const,
	options: ["employees", "filter-options"] as const,
};

export function useCreateEmployee() {
	return useMutation({ mutationFn: EmployeesService.create });
}

export function useEmployees(query: EmployeeDirectoryQuery) {
	return useQuery({
		queryKey: EMPLOYEE_KEYS.list(query),
		queryFn: () => EmployeesService.list(query),
	});
}

export function useEmployeeFilterOptions() {
	return useQuery({
		queryKey: EMPLOYEE_KEYS.options,
		queryFn: EmployeesService.filterOptions,
	});
}

export function useEmployee(id: string) {
	return useQuery({
		queryKey: EMPLOYEE_KEYS.detail(id),
		queryFn: () => EmployeesService.get(id),
	});
}

export function useUpdateEmployee() {
	return useMutation({ mutationFn: EmployeesService.update });
}

export function useTerminateEmployee() {
	return useMutation({ mutationFn: EmployeesService.terminate });
}

export function useExportEmployees() {
	return useMutation({ mutationFn: EmployeesService.exportCsv });
}
