import { createSeedData } from "../../src/seed/seed-data";

describe("demo employee generation", () => {
	it("generates varied names beyond the old 36-name pool per country", () => {
		const { employees } = createSeedData(250);
		for (const country of ["US", "IN", "GB", "DE", "CA"]) {
			const names = employees.filter((employee) => employee.countryCode === country).map((employee) => employee.name);
			expect(new Set(names).size).toBeGreaterThan(40);
			expect(names.every((name) => name.trim().length > 0 && name.length <= 120)).toBe(true);
		}
	});

	it("reproduces the same employees, FX rates and history without a clock dependency", () => {
		expect(createSeedData(30)).toEqual(createSeedData(30));
	});

	it("produces valid, linked data across countries, levels, statuses and genders", () => {
		const { employees, history, fxRates } = createSeedData(120);
		expect(employees).toHaveLength(120);
		expect(new Set(employees.map((employee) => employee.id)).size).toBe(120);
		expect(new Set(employees.map((employee) => employee.countryCode)).size).toBe(5);
		expect(new Set(employees.map((employee) => employee.level)).size).toBe(6);
		expect(new Set(employees.map((employee) => employee.gender)).size).toBe(4);
		expect(new Set(employees.map((employee) => employee.status))).toEqual(new Set(["active", "terminated"]));
		const currencies = new Map([["US", "USD"], ["IN", "INR"], ["GB", "GBP"], ["DE", "EUR"], ["CA", "CAD"]]);
		for (const [index, employee] of employees.entries()) {
			expect(employee.currencyCode).toBe(currencies.get(employee.countryCode));
			expect(employee.annualBaseMinor).toBeGreaterThan(0);
			expect(employee.annualBaseMinor).toBeLessThanOrEqual(1_000_000_000);
			expect(Number.isInteger(employee.annualBaseMinor)).toBe(true);
			expect(employee.bonusTargetBps).toBeGreaterThanOrEqual(0);
			expect(employee.bonusTargetBps).toBeLessThanOrEqual(10_000);
			expect(employee.hireDate.getTime()).toBeLessThanOrEqual(Date.UTC(2026, 0, 1));
			expect(history[index]).toMatchObject({
				employeeId: employee.id,
				oldBaseMinor: null,
				oldBonusBps: null,
				oldCurrencyCode: null,
				newBaseMinor: employee.annualBaseMinor,
				newBonusBps: employee.bonusTargetBps,
				newCurrencyCode: employee.currencyCode,
			});
		}
		expect(history).toHaveLength(120);
		expect(fxRates.map(({ currencyCode, usdRateMicros }) => [currencyCode, usdRateMicros])).toEqual([
			["USD", 1_000_000], ["INR", 12_000], ["GBP", 1_250_000], ["EUR", 1_100_000], ["CAD", 740_000],
		]);
	});
});
