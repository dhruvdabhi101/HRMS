import type {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
	EMPLOYEE_SORT_FIELDS,
} from "../constants";

export interface CreateEmployeeInput {
	name: string;
	countryCode: (typeof EMPLOYEE_COUNTRIES)[number]["code"];
	department: string;
	jobTitle: string;
	level: (typeof EMPLOYEE_LEVELS)[number];
	gender: (typeof EMPLOYEE_GENDERS)[number];
	hireDate: string;
	annualBaseMinor: number;
	bonusTargetBps: number;
	currencyCode?: string;
}

export interface EmployeeDirectoryQuery {
	page?: number;
	pageSize?: number;
	search?: string;
	countryCode?: CreateEmployeeInput["countryCode"];
	department?: string;
	jobTitle?: string;
	level?: CreateEmployeeInput["level"];
	status?: "active" | "terminated" | "all";
	sortBy?: (typeof EMPLOYEE_SORT_FIELDS)[number];
	sortDirection?: "asc" | "desc";
}

export type EmployeeListItem = Pick<
	EmployeeDetail,
	| "id"
	| "name"
	| "countryCode"
	| "department"
	| "jobTitle"
	| "level"
	| "status"
	| "currencyCode"
	| "annualBaseMinor"
	| "bonusTargetBps"
>;

export interface EmployeeDirectoryResponse {
	items: EmployeeListItem[];
	totalCount: number;
	page: number;
	pageSize: number;
}

export interface EmployeeFilterOptions {
	departments: string[];
	jobTitles: string[];
}

export interface CompensationChangeResponse {
	id: string;
	oldBaseMinor: number | null;
	newBaseMinor: number;
	oldBonusBps: number | null;
	newBonusBps: number;
	oldCurrencyCode: string | null;
	newCurrencyCode: string;
	changedAt: string;
}

export interface EmployeeDetail extends CreateEmployeeInput {
	id: string;
	status: "active" | "terminated";
	currencyCode: string;
	bonusMinor: number;
	targetMinor: number;
	createdAt: string;
	updatedAt: string;
	compensationChanges: CompensationChangeResponse[];
}
