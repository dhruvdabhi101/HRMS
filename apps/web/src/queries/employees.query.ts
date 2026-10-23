import { useMutation, useQuery } from "@tanstack/react-query";
import { EmployeesService } from "@/services";

export const EMPLOYEE_KEYS = {
	all: ["employees"] as const,
	detail: (id: string) => ["employees", "detail", id] as const,
};

export function useCreateEmployee() {
	return useMutation({ mutationFn: EmployeesService.create });
}

export function useEmployee(id: string) {
	return useQuery({
		queryKey: EMPLOYEE_KEYS.detail(id),
		queryFn: () => EmployeesService.get(id),
	});
}
