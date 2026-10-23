import request from "supertest";
import { createInsightsApp, insightEmployee as base } from "../helpers/insights-app";

describe("gender pay comparisons", () => {
	let context: Awaited<ReturnType<typeof createInsightsApp>>;
	const report = (query = {}) => request(context.app.getHttpServer()).get("/api/insights/gender").query(query);
	const genders = async (women: number[], men: number[]) => context.prisma.employee.createMany({ data: [
		...women.map(annualBaseMinor => ({ ...base, annualBaseMinor })),
		...men.map(annualBaseMinor => ({ ...base, gender: "man" as const, annualBaseMinor })),
	] });
	beforeEach(async () => { context = await createInsightsApp(); });
	afterEach(async () => { await context?.close(); });

	it("compares medians within a level, shows every gender/count and excludes other genders from the gap", async () => {
		await genders([8_000_000, 10_000_000], [10_000_000, 12_000_000]);
		await context.prisma.employee.createMany({ data: [
			{ ...base, gender: "undisclosed", annualBaseMinor: 20_000_000 }, { ...base, gender: "non_binary", annualBaseMinor: 50_000_000 },
			{ ...base, status: "terminated", annualBaseMinor: 999_000_000 },
		] });
		const { body } = await report().expect(200);
		expect(body.currencyCode).toBe("USD"); expect(body.groups).toHaveLength(1);
		expect(body.groups[0]).toMatchObject({ level: "L3", gapPercent: 18.18, smallSample: true });
		expect(body.groups[0].genders).toEqual([
			{ gender: "woman", headcount: 2, median: 9_000_000 }, { gender: "man", headcount: 2, median: 11_000_000 },
			{ gender: "non_binary", headcount: 1, median: 50_000_000 }, { gender: "undisclosed", headcount: 1, median: 20_000_000 },
		]);
		expect(body.fxRates).toContainEqual({ currencyCode: "INR", usdRateMicros: 12_000, asOfDate: "2026-01-01" });
	});

	it.each([[[120, 140], [100, 120], -18.18], [[100, 101], [101], 0.5], [[100], [100], 0]])("uses unrounded medians and the men's reference for %j versus %j", async (women, men, gapPercent) => {
		await genders(women, men);
		const { body } = await report().expect(200); expect(body.groups[0].gapPercent).toBe(gapPercent);
		if (women.length === 2 && women[0] === 100) expect(body.groups[0].genders[0].median).toBe(100.5);
	});

	it.each([[[100], []], [[], [100]]])("returns an unavailable gap when a comparison gender is missing", async (women, men) => {
		await genders(women, men); const { body } = await report().expect(200);
		expect(body.groups[0].gapPercent).toBeNull(); expect(body.groups[0].genders).toHaveLength(1);
	});

	it("returns an unavailable gap for a zero converted men's median, but allows a zero women's median", async () => {
		await context.prisma.employee.createMany({ data: [{ ...base, gender: "man", countryCode: "IN", currencyCode: "INR", annualBaseMinor: 1 }, base] });
		expect((await report().expect(200)).body.groups[0].gapPercent).toBeNull();
		await context.prisma.employee.deleteMany();
		await context.prisma.employee.createMany({ data: [{ ...base, countryCode: "IN", currencyCode: "INR", annualBaseMinor: 1 }, { ...base, gender: "man" }] });
		expect((await report().expect(200)).body.groups[0].gapPercent).toBe(100);
	});

	it.each([[4, 5, true], [5, 4, true], [5, 5, false]])("marks small samples at %s women and %s men", async (women, men, smallSample) => {
		await genders(Array(women).fill(100), Array(men).fill(120));
		expect((await report().expect(200)).body.groups[0].smallSample).toBe(smallSample);
	});

	it("keeps levels independent and returns no fabricated groups", async () => {
		expect((await report().expect(200)).body.groups).toEqual([]);
		await genders([80], [100]);
		await context.prisma.employee.createMany({ data: [{ ...base, level: "L4", annualBaseMinor: 200 }, { ...base, level: "L4", gender: "man", annualBaseMinor: 400 }] });
		const { body } = await report().expect(200);
		expect(body.groups.map((group: { level: string; gapPercent: number }) => [group.level, group.gapPercent])).toEqual([["L3", 20], ["L4", 50]]);
	});

	it("converts mixed currencies before taking medians and ignores compensation history", async () => {
		const employee = await context.prisma.employee.create({ data: { ...base, countryCode: "IN", currencyCode: "INR", annualBaseMinor: 100_000_000 } });
		await context.prisma.employee.create({ data: { ...base, gender: "man", annualBaseMinor: 1_200_000 } });
		await context.prisma.compensationChange.create({ data: { employeeId: employee.id, newBaseMinor: 999_000_000, newBonusBps: 0, newCurrencyCode: "INR" } });
		const { body } = await report().expect(200); expect(body.groups[0].gapPercent).toBe(0);
		expect(body.groups[0].genders).toEqual([{ gender: "woman", headcount: 1, median: 1_200_000 }, { gender: "man", headcount: 1, median: 1_200_000 }]);
	});

	it("combines all supported exact filters and safely binds SQL-like strings", async () => {
		await context.prisma.employee.createMany({ data: [base, { ...base, countryCode: "CA", currencyCode: "CAD" }, { ...base, department: "Sales" }, { ...base, jobTitle: "Manager" }, { ...base, level: "L2" }] });
		const { body } = await report({ countryCode: "US", department: " Engineering ", jobTitle: " Engineer ", level: "L3" }).expect(200);
		expect(body.groups[0].genders).toEqual([{ gender: "woman", headcount: 1, median: 1_000 }]);
		expect((await report({ department: "' OR 1=1 --" }).expect(200)).body.groups).toEqual([]);
	});

	it("keeps non-binary-only levels visible without inventing women/men or a gap", async () => {
		await context.prisma.employee.create({ data: { ...base, gender: "non_binary" } });
		const { body } = await report().expect(200); expect(body.groups[0].gapPercent).toBeNull();
		expect(body.groups[0].genders).toEqual([{ gender: "non_binary", headcount: 1, median: 1_000 }]);
	});

	it.each([{ gender: "woman" }, { status: "all" }, { countryCode: "XX" }, { level: "L7" }, { department: ["a", "b"] }, { jobTitle: "x".repeat(101) }, { dimensions: "gender" }, { metric: "median" }, { page: 1 }])("rejects unsupported comparison queries %j", async query => { await report(query).expect(400); });
	it("refuses invalid FX configuration", async () => { await context.prisma.fxRate.update({ where: { currencyCode: "USD" }, data: { usdRateMicros: -1 } }); await report().expect(503); });
});
