import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	EMPLOYEE_LIMITS,
	EMPLOYEE_SORT_FIELDS,
} from "@repo/shared";
import { createParser, parseAsStringLiteral } from "nuqs/server";

function positiveInteger(max: number) {
	return createParser({
		parse(value) {
			if (!/^\d+$/.test(value)) return null;
			const number = Number(value);
			return Number.isSafeInteger(number) && number >= 1 && number <= max
				? number
				: null;
		},
		serialize: String,
	});
}

function trimmedText(maxLength: number) {
	return createParser({
		parse(value) {
			const text = value.trim();
			return text.length > 0 && text.length <= maxLength ? text : null;
		},
		serialize: String,
	});
}

export const employeeDirectorySearchParams = {
	page: positiveInteger(Math.floor(Number.MAX_SAFE_INTEGER / 100)).withDefault(
		1,
	),
	pageSize: positiveInteger(100).withDefault(25),
	search: trimmedText(EMPLOYEE_LIMITS.name).withDefault(""),
	countryCode: parseAsStringLiteral(EMPLOYEE_COUNTRIES.map(({ code }) => code)),
	department: trimmedText(EMPLOYEE_LIMITS.department),
	jobTitle: trimmedText(EMPLOYEE_LIMITS.jobTitle),
	level: parseAsStringLiteral(EMPLOYEE_LEVELS),
	status: parseAsStringLiteral(["active", "terminated", "all"]).withDefault(
		"active",
	),
	sortBy: parseAsStringLiteral(EMPLOYEE_SORT_FIELDS).withDefault("name"),
	sortDirection: parseAsStringLiteral(["asc", "desc"]).withDefault("asc"),
};
