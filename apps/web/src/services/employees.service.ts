import type {
	CreateEmployeeInput,
	EmployeeDetail,
	EmployeeDirectoryQuery,
	EmployeeDirectoryResponse,
	EmployeeFilterOptions,
} from "@repo/shared";
import { ApiClient } from "@/lib/api-client";

export class EmployeesService {
	static list(query: EmployeeDirectoryQuery) {
		return ApiClient.get<EmployeeDirectoryResponse>("/api/employees", {
			...query,
		});
	}
	static filterOptions() {
		return ApiClient.get<EmployeeFilterOptions>(
			"/api/employees/filter-options",
		);
	}
	static create(input: CreateEmployeeInput) {
		return ApiClient.post<EmployeeDetail>("/api/employees", input);
	}
	static get(id: string) {
		return ApiClient.get<EmployeeDetail>(
			`/api/employees/${encodeURIComponent(id)}`,
		);
	}
}
