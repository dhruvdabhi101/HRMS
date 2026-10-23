import type {
	CreateEmployeeInput,
	EmployeeDetail,
	EmployeeDirectoryQuery,
	EmployeeDirectoryResponse,
	EmployeeFilterOptions,
	UpdateEmployeeInput,
} from "@repo/shared";
import { ApiClient } from "@/lib/api-client";

export class EmployeesService {
	static list(query: EmployeeDirectoryQuery) {
		return ApiClient.get<EmployeeDirectoryResponse>("/api/employees", {
			...query,
		});
	}
	static exportCsv(query: EmployeeDirectoryQuery) {
		return ApiClient.get<string>("/api/employees/export", { ...query });
	}
	static filterOptions() {
		return ApiClient.get<EmployeeFilterOptions>(
			"/api/employees/filter-options",
		);
	}
	static create(input: CreateEmployeeInput) {
		return ApiClient.post<EmployeeDetail>("/api/employees", input);
	}
	static update({ id, input }: { id: string; input: UpdateEmployeeInput }) {
		return ApiClient.patch<EmployeeDetail>(
			`/api/employees/${encodeURIComponent(id)}`,
			input,
		);
	}
	static terminate(id: string) {
		return ApiClient.delete<EmployeeDetail>(
			`/api/employees/${encodeURIComponent(id)}`,
		);
	}
	static get(id: string) {
		return ApiClient.get<EmployeeDetail>(
			`/api/employees/${encodeURIComponent(id)}`,
		);
	}
}
