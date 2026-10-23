import { de, en_CA, en_GB, en_IN, en_US } from "@faker-js/faker";

export const SEED_DATE = new Date("2026-01-01T00:00:00.000Z");
export const SEED_EMPLOYEE_COUNT = 10_000;

export const SEED_COUNTRIES = [
	{
		countryCode: "US",
		locale: en_US,
		currencyCode: "USD",
		usdRateMicros: 1_000_000,
		baseUsd: 65_000,
	},
	{
		countryCode: "IN",
		locale: en_IN,
		currencyCode: "INR",
		usdRateMicros: 12_000,
		baseUsd: 18_000,
	},
	{
		countryCode: "GB",
		locale: en_GB,
		currencyCode: "GBP",
		usdRateMicros: 1_250_000,
		baseUsd: 55_000,
	},
	{
		countryCode: "DE",
		locale: de,
		currencyCode: "EUR",
		usdRateMicros: 1_100_000,
		baseUsd: 50_000,
	},
	{
		countryCode: "CA",
		locale: en_CA,
		currencyCode: "CAD",
		usdRateMicros: 740_000,
		baseUsd: 50_000,
	},
] as const;

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
