import type { EmployeeDetail, EmployeeDirectoryQuery } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmployeesService } from "@/services";

export const EMPLOYEE_KEYS = {
	all: ["employees"] as const,
	lists: ["employees", "list"] as const,
	detail: (id: string) => ["employees", "detail", id] as const,
	list: (query: EmployeeDirectoryQuery) =>
		["employees", "list", query] as const,
	options: ["employees", "filter-options"] as const,
};

function useEmployeeMutation<Input>(
	mutationFn: (input: Input) => Promise<EmployeeDetail>,
) {
	const cache = useQueryClient();
	return useMutation({
		mutationFn,
		onSuccess: (employee) => {
			const queryKey = EMPLOYEE_KEYS.detail(employee.id);
			return cache.cancelQueries({ queryKey, exact: true }).then(() => {
				cache.setQueryData(queryKey, employee);
				cache.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists });
				cache.invalidateQueries({ queryKey: EMPLOYEE_KEYS.options });
			});
		},
	});
}

export function useCreateEmployee() {
	return useEmployeeMutation(EmployeesService.create);
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

export function useEmployee(id: string, refreshOnMount = false) {
	return useQuery({
		queryKey: EMPLOYEE_KEYS.detail(id),
		queryFn: () => EmployeesService.get(id),
		refetchOnMount: refreshOnMount ? "always" : true,
	});
}

export function useUpdateEmployee() {
	return useEmployeeMutation(EmployeesService.update);
}

export function useTerminateEmployee() {
	return useEmployeeMutation(EmployeesService.terminate);
}

export function useExportEmployees() {
	return useMutation({ mutationFn: EmployeesService.exportCsv });
}
