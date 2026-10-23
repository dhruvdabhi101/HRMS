import type { PAY_DIMENSIONS, PAY_METRICS } from "../constants";
import type { EmployeeDirectoryQuery } from "./employees.types";

export type PayDimension = (typeof PAY_DIMENSIONS)[number];
export type PayMetric = (typeof PAY_METRICS)[number];
export interface PayGroupsQuery
	extends Pick<
		EmployeeDirectoryQuery,
		"countryCode" | "department" | "jobTitle" | "level"
	> {
	dimensions: PayDimension[];
	metric: PayMetric;
}
export interface PayGroup {
	dimensions: Partial<Record<PayDimension, string>>;
	headcount: number;
	value: number;
}
export interface PayFxRate {
	currencyCode: string;
	usdRateMicros: number;
	asOfDate: string;
}
export interface PayGroupsResponse {
	dimensions: PayDimension[];
	metric: PayMetric;
	currencyCode: "USD";
	fxRates: PayFxRate[];
	groups: PayGroup[];
}

export type PayFilters = Pick<
	EmployeeDirectoryQuery,
	"countryCode" | "department" | "jobTitle" | "level"
>;
export interface PayDistributionQuery extends PayFilters {
	employeeId?: string;
	page?: number;
	pageSize?: number;
}
export interface PayDistributionSummary {
	headcount: number;
	min: number;
	q1: number;
	median: number;
	average: number;
	q3: number;
	max: number;
	lowerWhisker: number;
	upperWhisker: number;
	lowerFence: number;
	upperFence: number;
	outlierCount: number;
	smallSample: boolean;
}
export interface PayOutlier {
	id: string;
	name: string;
	annualBaseUsd: number;
}
export interface EmployeePayPosition extends PayOutlier {
	status: "active" | "terminated";
	includedInCohort: boolean;
	isOutlier: boolean | null;
}
export interface PayDistributionResponse {
	currencyCode: "USD";
	fxRates: PayFxRate[];
	summary: PayDistributionSummary | null;
	employee: EmployeePayPosition | null;
	outliers: {
		items: PayOutlier[];
		totalCount: number;
		page: number;
		pageSize: number;
	};
}
export interface GenderPayGroup {
	level: NonNullable<PayFilters["level"]>;
	genders: {
		gender: "woman" | "man" | "non_binary" | "undisclosed";
		headcount: number;
		median: number;
	}[];
	gapPercent: number | null;
	smallSample: boolean;
}
export interface GenderPayResponse {
	currencyCode: "USD";
	fxRates: PayFxRate[];
	groups: GenderPayGroup[];
}
