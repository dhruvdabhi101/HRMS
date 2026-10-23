import {
	EMPLOYEE_COUNTRIES,
	type EmployeeDetail,
	type PayDimension,
	type PayFilters,
	type PayGroup,
	type PayMetric,
} from "@repo/shared";
import { formatEmployeeMoney } from "./employees.utils";

export function formatPayValue(value: number, metric: PayMetric) {
	return metric === "headcount"
		? value.toLocaleString("en-US")
		: formatEmployeeMoney(value, "USD");
}
export function payDimensionValue(group: PayGroup, dimension: PayDimension) {
	const value = group.dimensions[dimension] ?? "";
	return dimension === "country" ? countryName(value) : value;
}
export function countryName(countryCode: string) {
	return (
		EMPLOYEE_COUNTRIES.find((country) => country.code === countryCode)?.name ??
		countryCode
	);
}
export function employeeComparisonGroups(employee: EmployeeDetail) {
	return [
		{
			filter: "countryCode",
			label: "Country",
			value: employee.countryCode,
			valueLabel: countryName(employee.countryCode),
		},
		{
			filter: "department",
			label: "Department",
			value: employee.department,
			valueLabel: employee.department,
		},
		{
			filter: "jobTitle",
			label: "Role",
			value: employee.jobTitle,
			valueLabel: employee.jobTitle,
		},
		{
			filter: "level",
			label: "Level",
			value: employee.level,
			valueLabel: employee.level,
		},
	] satisfies {
		filter: keyof PayFilters;
		label: string;
		value: string;
		valueLabel: string;
	}[];
}
export function describeMedianPosition(valueUsd: number, medianUsd: number) {
	if (valueUsd === medianUsd) return "At the median";
	if (medianUsd === 0)
		return valueUsd > 0 ? "Above the median" : "At the median";
	const percent = Math.round(
		(Math.abs(valueUsd - medianUsd) / medianUsd) * 100,
	);
	if (percent === 0)
		return `Less than 1% ${valueUsd > medianUsd ? "above" : "below"} the median`;
	if (valueUsd > medianUsd) return `${percent}% above the median`;
	// A positive salary rounded to "100% below" would read as zero pay.
	return `${valueUsd > 0 ? Math.min(percent, 99) : percent}% below the median`;
}
