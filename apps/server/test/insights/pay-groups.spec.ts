import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestDatabase } from "../helpers/test-database";

const base = { name: "Synthetic employee", countryCode: "US", currencyCode: "USD", department: "Engineering", jobTitle: "Engineer", level: "L3", gender: "woman" as const, hireDate: new Date("2024-02-29"), annualBaseMinor: 10_000_000, bonusTargetBps: 1_000 };
const rates = [
	{ currencyCode: "USD", usdRateMicros: 1_000_000 },
	{ currencyCode: "INR", usdRateMicros: 12_000 },
	{ currencyCode: "GBP", usdRateMicros: 1_250_000 },
	{ currencyCode: "EUR", usdRateMicros: 1_100_000 },
	{ currencyCode: "CAD", usdRateMicros: 740_000 },
].map(rate => ({ ...rate, asOfDate: new Date("2026-01-01") }));

describe("grouped pay insights", () => {
	let app: INestApplication;
	let database: Awaited<ReturnType<typeof createTestDatabase>>;
	const report = (query = {}) => request(app.getHttpServer()).get("/api/insights/groups").query(query);
	const salaries = (values: number[]) => database.prisma.employee.createMany({ data: values.map(annualBaseMinor => ({ ...base, annualBaseMinor })) });
	beforeEach(async () => {
		database = await createTestDatabase();
		await database.prisma.fxRate.createMany({ data: rates });
		const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(database.prisma).compile();
		app = module.createNestApplication({ logger: false });
		app.setGlobalPrefix("api");
		app.useGlobalPipes(createValidationPipe());
		app.useGlobalFilters(new GlobalExceptionFilter());
		await app.listen(0, "127.0.0.1");
	});
	afterEach(async () => { await app?.close(); await database?.close(); });

	it.each([
		["headcount", 2], ["min", 10_000_000], ["median", 11_000_000],
		["average", 11_000_000], ["max", 12_000_000], ["totalTarget", 25_400_000],
	])("computes %s from current active employees without counting history", async (metric, value) => {
		const first = await database.prisma.employee.create({ data: base });
		await database.prisma.employee.createMany({ data: [
			{ ...base, annualBaseMinor: 12_000_000, bonusTargetBps: 2_000 },
			{ ...base, annualBaseMinor: 999_000_000, status: "terminated" },
		] });
		await database.prisma.compensationChange.createMany({ data: [1, 2, 3].map(() => ({ employeeId: first.id, newBaseMinor: 999_000_000, newBonusBps: 10_000, newCurrencyCode: "USD" })) });
		const { body } = await report({ metric }).expect(200);
		expect(body.dimensions).toEqual(["country"]);
		expect(body.metric).toBe(metric);
		expect(body.currencyCode).toBe("USD");
		expect(body.groups).toEqual([{ dimensions: { country: "US" }, headcount: 2, value }]);
		expect(body.groups[0]).not.toHaveProperty("employees");
	});

	it.each([
		[[10_000], 10_000], [[30_000, 10_000, 20_000], 20_000],
		[[40_000, 10_000, 30_000, 20_000], 25_000],
		[[10_001, 10_000], 10_001], [[10_000, 10_000, 20_000, 20_000], 15_000],
	])("calculates median with cents rounded half up for %j", async (values, expected) => {
		await salaries(values);
		const { body } = await report().expect(200);
		expect(body.metric).toBe("median");
		expect(body.groups).toEqual([{ dimensions: { country: "US" }, headcount: values.length, value: expected }]);
	});

	it("rounds an average only after the statistic is calculated", async () => {
		await salaries([10_000, 10_000, 10_002]);
		expect((await report({ metric: "average" }).expect(200)).body.groups[0].value).toBe(10_001);
	});

	it("converts each employee before aggregation and rounds local bonus before converting target", async () => {
		await database.prisma.employee.createMany({ data: [
			{ ...base, countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 10_025, bonusTargetBps: 0 },
			{ ...base, countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 10_025, bonusTargetBps: 0 },
			{ ...base, annualBaseMinor: 10_005 },
			{ ...base, countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 1, bonusTargetBps: 10_000 },
		] });
		const { body } = await report({ dimensions: "department", metric: "totalTarget" }).expect(200);
		expect(body.groups).toEqual([{ dimensions: { department: "Engineering" }, headcount: 4, value: 25_845 }]);
	});

	it("normalizes all five supported currencies using the current fixed table with truthful reference dates", async () => {
		await database.prisma.employee.createMany({ data: [
			{ ...base, annualBaseMinor: 10_005 },
			{ ...base, countryCode: "IN", currencyCode: "INR", annualBaseMinor: 100_000_000 },
			{ ...base, countryCode: "GB", currencyCode: "GBP", annualBaseMinor: 10_000 },
			{ ...base, countryCode: "DE", currencyCode: "EUR", annualBaseMinor: 10_000 },
			{ ...base, countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 10_025 },
		] });
		const { body } = await report({ metric: "min" }).expect(200);
		expect(body.groups).toEqual([
			{ dimensions: { country: "CA" }, headcount: 1, value: 7_419 },
			{ dimensions: { country: "DE" }, headcount: 1, value: 11_000 },
			{ dimensions: { country: "GB" }, headcount: 1, value: 12_500 },
			{ dimensions: { country: "IN" }, headcount: 1, value: 1_200_000 },
			{ dimensions: { country: "US" }, headcount: 1, value: 10_005 },
		]);
		expect(body.fxRates).toEqual([...rates].sort((a, b) => a.currencyCode.localeCompare(b.currencyCode)).map(rate => ({ ...rate, asOfDate: "2026-01-01" })));
		await database.prisma.fxRate.update({ where: { currencyCode: "CAD" }, data: { usdRateMicros: 750_000, asOfDate: new Date("2026-02-01") } });
		const changed = (await report({ countryCode: "CA" }).expect(200)).body;
		expect(changed.groups[0].value).toBe(7_519);
		expect(changed.fxRates.find((rate: { currencyCode: string }) => rate.currencyCode === "CAD").asOfDate).toBe("2026-02-01");
	});

	it.each(["country,level", "department,title", "title,department", "level,country"])("partitions and stably orders independent groups for %s", async dimensions => {
		await database.prisma.employee.createMany({ data: [
			{ ...base, annualBaseMinor: 30_000 },
			{ ...base, annualBaseMinor: 10_000 },
			{ ...base, department: "Sales", jobTitle: "Seller", level: "L2", annualBaseMinor: 50_000 },
		] });
		const dimensionKeys: Record<string, string> = { country: "countryCode", level: "level", department: "department", title: "jobTitle" };
		const expected = [
			{ ...base, value: 20_000, headcount: 2 },
			{ ...base, department: "Sales", jobTitle: "Seller", level: "L2", value: 50_000, headcount: 1 },
		].map(row => ({ dimensions: Object.fromEntries(dimensions.split(",").map(key => [key, row[dimensionKeys[key] as keyof typeof row]])), headcount: row.headcount, value: row.value }))
		.sort((a, b) => { for (const key of dimensions.split(",")) { const order = String(a.dimensions[key]).localeCompare(String(b.dimensions[key])); if (order) return order; } return 0; });
		expect((await report({ dimensions }).expect(200)).body.groups).toEqual(expected);
	});

	it.each([
		[{ countryCode: "US" }, 2], [{ department: " Sales " }, 1],
		[{ jobTitle: " Engineer " }, 2], [{ level: "L2" }, 1],
		[{ countryCode: "US", department: "Engineering", jobTitle: "Engineer", level: "L3" }, 1],
		[{ countryCode: "CA", department: "Sales" }, 0], [{ department: "' OR 1=1 --" }, 0],
	])("combines active-only exact filters with AND for %j", async (filters, headcount) => {
		await database.prisma.employee.createMany({ data: [
			base, { ...base, department: "Sales", jobTitle: "Seller", level: "L2" },
			{ ...base, countryCode: "CA", currencyCode: "CAD" }, { ...base, status: "terminated" },
		] });
		const { body } = await report({ ...filters, dimensions: "department", metric: "headcount" }).expect(200);
		expect(body.groups.reduce((sum: number, group: { value: number }) => sum + group.value, 0)).toBe(headcount);
		if (!headcount) expect(body.groups).toEqual([]);
	});

	it("keeps Unicode, delimiter characters and SQL-like text as separate literal group keys", async () => {
		await database.prisma.employee.createMany({ data: [
			{ ...base, department: "a|b", jobTitle: "c" },
			{ ...base, department: "a", jobTitle: "b|c" },
			{ ...base, department: "研发' OR 1=1 --", jobTitle: "工程师" },
		] });
		const { body } = await report({ dimensions: "department,title", metric: "headcount" }).expect(200);
		expect(body.groups).toHaveLength(3);
		expect(body.groups.every((group: { value: number }) => group.value === 1)).toBe(true);
		expect((await report({ department: "研发' OR 1=1 --" }).expect(200)).body.groups[0].headcount).toBe(1);
	});

	it("returns no fabricated groups for empty or entirely terminated data", async () => {
		expect((await report().expect(200)).body.groups).toEqual([]);
		await database.prisma.employee.create({ data: { ...base, status: "terminated" } });
		expect((await report().expect(200)).body.groups).toEqual([]);
	});

	it("handles converted zero cents, exact half-cent FX rounding and totals exceeding 32-bit integers", async () => {
		await database.prisma.employee.create({ data: { ...base, countryCode: "IN", currencyCode: "INR", annualBaseMinor: 1 } });
		expect((await report().expect(200)).body.groups[0].value).toBe(0);
		await database.prisma.employee.create({ data: { ...base, countryCode: "GB", currencyCode: "GBP", annualBaseMinor: 2 } });
		expect((await report({ countryCode: "GB" }).expect(200)).body.groups[0].value).toBe(3);
		await database.prisma.employee.createMany({ data: [1, 2, 3].map(() => ({ ...base, annualBaseMinor: 1_000_000_000, bonusTargetBps: 10_000 })) });
		expect((await report({ countryCode: "US", metric: "totalTarget" }).expect(200)).body.groups[0].value).toBe(6_000_000_000);
	});

	it("reflects edits and termination without changing data", async () => {
		const employee = await database.prisma.employee.create({ data: base });
		await request(app.getHttpServer()).patch(`/api/employees/${employee.id}`).send({ annualBaseMinor: 20_000_000 }).expect(200);
		expect((await report().expect(200)).body.groups[0].value).toBe(20_000_000);
		await request(app.getHttpServer()).delete(`/api/employees/${employee.id}`).expect(200);
		expect((await report().expect(200)).body.groups).toEqual([]);
		expect(await database.prisma.employee.count()).toBe(1);
		expect(await database.prisma.compensationChange.count()).toBe(1);
	});

	it.each([0, -1])("fails explicitly instead of publishing misleading pay when a stored FX rate is %s", async usdRateMicros => {
		await salaries([10_000]);
		await database.prisma.fxRate.update({ where: { currencyCode: "USD" }, data: { usdRateMicros } });
		await report().expect(503);
	});

	it.each([
		{ dimensions: "" }, { dimensions: "country,country" }, { dimensions: "country,level,title" },
		{ dimensions: "gender" }, { dimensions: "constructor" }, { dimensions: "country); DROP TABLE Employee;--" },
		{ dimensions: ["country", "level"] }, { metric: "sum" }, { metric: "median); DROP TABLE Employee;--" },
		{ metric: ["min", "max"] }, { countryCode: "XX" }, { level: "L7" },
		{ department: "x".repeat(101) }, { jobTitle: "x".repeat(101) }, { department: ["Sales", "Engineering"] },
		{ status: "all" }, { page: 1 }, { unknown: "value" },
	])("rejects malformed or unsupported report query %j without altering employees", async query => {
		await salaries([10_000]);
		const { body } = await report(query).expect(400);
		expect(Object.keys(body.fieldErrors).length).toBeGreaterThan(0);
		expect(await database.prisma.employee.count()).toBe(1);
	});
});
