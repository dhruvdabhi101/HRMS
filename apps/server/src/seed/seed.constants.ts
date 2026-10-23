import { de, en_CA, en_GB, en_IN, en_US } from "@faker-js/faker";
import { EMPLOYEE_COUNTRIES } from "@repo/shared";

export const SEED_DATE = new Date("2026-01-01T00:00:00.000Z");
export const SEED_EMPLOYEE_COUNT = 10_000;

const COUNTRY_SEED_SETTINGS = {
	US: { locale: en_US, usdRateMicros: 1_000_000, baseUsd: 65_000 },
	IN: { locale: en_IN, usdRateMicros: 12_000, baseUsd: 18_000 },
	GB: { locale: en_GB, usdRateMicros: 1_250_000, baseUsd: 55_000 },
	DE: { locale: de, usdRateMicros: 1_100_000, baseUsd: 50_000 },
	CA: { locale: en_CA, usdRateMicros: 740_000, baseUsd: 50_000 },
} as const;

export const SEED_COUNTRIES = EMPLOYEE_COUNTRIES.map((country) => ({
	countryCode: country.code,
	currencyCode: country.currency,
	...COUNTRY_SEED_SETTINGS[country.code],
}));

export const SEED_DEPARTMENTS = [
	{
		name: "Engineering",
		titles: ["Software Engineer", "Platform Engineer"],
		payFactor: 1.2,
	},
	{
		name: "Sales",
		titles: ["Account Executive", "Sales Operations Analyst"],
		payFactor: 1,
	},
	{
		name: "Finance",
		titles: ["Financial Analyst", "Accountant"],
		payFactor: 1.05,
	},
	{ name: "People", titles: ["HR Specialist", "Recruiter"], payFactor: 0.9 },
	{
		name: "Operations",
		titles: ["Operations Analyst", "Program Manager"],
		payFactor: 0.95,
	},
	{
		name: "Marketing",
		titles: ["Marketing Specialist", "Content Strategist"],
		payFactor: 0.95,
	},
] as const;
