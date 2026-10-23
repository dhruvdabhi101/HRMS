import { CompensationChange, Employee, FxRate, Gender } from "@repo/db";
import { SEED_COUNTRIES, SEED_DATE, SEED_DEPARTMENTS } from "./seed.constants";

function createRandom() {
	let state = 42;
	return () => {
		state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
		return state / 4_294_967_296;
	};
}

function createEmployee(index: number, random: () => number): Employee {
	const country = SEED_COUNTRIES[index % SEED_COUNTRIES.length];
	const department =
		SEED_DEPARTMENTS[
			Math.floor(index / SEED_COUNTRIES.length) % SEED_DEPARTMENTS.length
		];
	const pick = <T>(values: readonly T[]) =>
		values[Math.floor(random() * values.length)];
	const level = 1 + Math.floor(random() * 6);
	const variation = 0.85 + random() * 0.3;
	const outlierFactor = index % 101 === 0 ? 1.7 : 1;
	const baseUsd =
		country.baseUsd *
		(0.7 + level * 0.32) *
		department.payFactor *
		variation *
		outlierFactor;
	const hireDate = new Date(
		SEED_DATE.getTime() - (1 + Math.floor(random() * 3_650)) * 86_400_000,
	);
	return {
		id: `00000000-0000-4000-8000-${(index + 1).toString(16).padStart(12, "0")}`,
		name: `${pick(country.firstNames)} ${pick(country.lastNames)}`,
		countryCode: country.countryCode,
		department: department.name,
		jobTitle: pick(department.titles),
		level: `L${level}`,
		gender: pick(Object.values(Gender)),
		hireDate,
		status: index % 11 === 0 ? "terminated" : "active",
		currencyCode: country.currencyCode,
		annualBaseMinor: Math.round(
			(baseUsd * 100_000_000) / country.usdRateMicros,
		),
		bonusTargetBps:
			department.name === "Sales" ? 2_000 : pick([0, 500, 1_000, 1_500]),
		createdAt: hireDate,
		updatedAt: hireDate,
	};
}

function createHistory(employee: Employee): CompensationChange {
	return {
		id: employee.id.replace(/^00000000/, "10000000"),
		employeeId: employee.id,
		oldBaseMinor: null,
		newBaseMinor: employee.annualBaseMinor,
		oldBonusBps: null,
		newBonusBps: employee.bonusTargetBps,
		oldCurrencyCode: null,
		newCurrencyCode: employee.currencyCode,
		changedAt: employee.hireDate,
		createdAt: employee.hireDate,
		updatedAt: employee.hireDate,
	};
}

export function createSeedData(count: number) {
	const random = createRandom();
	const employees = Array.from({ length: count }, (_, index) =>
		createEmployee(index, random),
	);
	const fxRates: FxRate[] = SEED_COUNTRIES.map((country) => ({
		currencyCode: country.currencyCode,
		usdRateMicros: country.usdRateMicros,
		asOfDate: SEED_DATE,
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	}));
	return { employees, history: employees.map(createHistory), fxRates };
}
