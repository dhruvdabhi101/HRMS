import type {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
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
