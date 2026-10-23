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
