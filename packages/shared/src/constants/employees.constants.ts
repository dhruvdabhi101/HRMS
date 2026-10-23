export const EMPLOYEE_COUNTRIES = [
	{ code: "US", name: "United States", currency: "USD" },
	{ code: "IN", name: "India", currency: "INR" },
	{ code: "GB", name: "United Kingdom", currency: "GBP" },
	{ code: "DE", name: "Germany", currency: "EUR" },
	{ code: "CA", name: "Canada", currency: "CAD" },
] as const;

export const EMPLOYEE_LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"] as const;
export const EMPLOYEE_GENDERS = [
	"woman",
	"man",
	"non_binary",
	"undisclosed",
] as const;
export const EMPLOYEE_SORT_FIELDS = [
	"name",
	"countryCode",
	"department",
	"jobTitle",
	"level",
] as const;
export const EMPLOYEE_LIMITS = {
	name: 120,
	department: 100,
	jobTitle: 100,
	annualBaseMinor: 1_000_000_000,
	bonusTargetBps: 10_000,
} as const;
