import type { CreateEmployeeInput, EmployeeDetail } from "@repo/shared";
import { ApiClient } from "@/lib/api-client";

export class EmployeesService {
	static create(input: CreateEmployeeInput) {
		return ApiClient.post<EmployeeDetail>("/api/employees", input);
	}
	static get(id: string) {
		return ApiClient.get<EmployeeDetail>(
			`/api/employees/${encodeURIComponent(id)}`,
		);
	}
}
