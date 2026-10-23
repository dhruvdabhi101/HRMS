export const SEED_DATE = new Date("2026-01-01T00:00:00.000Z");
export const SEED_EMPLOYEE_COUNT = 10_000;

export const SEED_COUNTRIES = [
	{
		countryCode: "US",
		currencyCode: "USD",
		usdRateMicros: 1_000_000,
		baseUsd: 65_000,
		firstNames: ["Avery", "Jordan", "Morgan", "Taylor", "Alex", "Casey"],
		lastNames: ["Smith", "Johnson", "Williams", "Garcia", "Chen", "Davis"],
	},
	{
		countryCode: "IN",
		currencyCode: "INR",
		usdRateMicros: 12_000,
		baseUsd: 18_000,
		firstNames: ["Asha", "Arjun", "Priya", "Rohan", "Kiran", "Sneha"],
		lastNames: ["Rao", "Shah", "Patel", "Singh", "Iyer", "Das"],
	},
	{
		countryCode: "GB",
		currencyCode: "GBP",
		usdRateMicros: 1_250_000,
		baseUsd: 55_000,
		firstNames: ["Amelia", "Oliver", "Charlie", "Isla", "Sam", "Robin"],
		lastNames: ["Wilson", "Brown", "Evans", "Clarke", "Ahmed", "Thomas"],
	},
	{
		countryCode: "DE",
		currencyCode: "EUR",
		usdRateMicros: 1_100_000,
		baseUsd: 50_000,
		firstNames: ["Lena", "Felix", "Alex", "Mia", "Luca", "Emil"],
		lastNames: ["Müller", "Schmidt", "Weber", "Fischer", "Wagner", "Becker"],
	},
	{
		countryCode: "CA",
		currencyCode: "CAD",
		usdRateMicros: 740_000,
		baseUsd: 50_000,
		firstNames: ["Noah", "Emma", "Riley", "Chloé", "Jamie", "Quinn"],
		lastNames: ["Martin", "Roy", "Tremblay", "Lee", "Bouchard", "Campbell"],
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
