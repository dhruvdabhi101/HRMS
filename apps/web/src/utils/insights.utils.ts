import {
	EMPLOYEE_COUNTRIES,
	type PayDimension,
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
	return dimension === "country"
		? (EMPLOYEE_COUNTRIES.find((country) => country.code === value)?.name ??
				value)
		: value;
}
