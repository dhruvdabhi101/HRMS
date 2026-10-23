import request from "supertest";
import { createInsightsApp, insightEmployee as base } from "../helpers/insights-app";

const id = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

describe("pay distribution and employee position", () => {
	let context: Awaited<ReturnType<typeof createInsightsApp>>;
	const report = (query = {}) => request(context.app.getHttpServer()).get("/api/insights/distribution").query(query);
	const salaries = (values: number[]) => context.prisma.employee.createMany({ data: values.map((annualBaseMinor, index) => ({ ...base, id: id(index + 1), annualBaseMinor })) });
	beforeEach(async () => { context = await createInsightsApp(); });
	afterEach(async () => { await context?.close(); });

	it("returns interpolated quartiles, mean, whiskers and paginated outliers with an employee marker", async () => {
		await salaries([1_000, 2_000, 3_000, 4_000, 10_000]);
		const { body } = await report({ employeeId: id(5) }).expect(200);
		expect(body.currencyCode).toBe("USD");
		expect(body.summary).toEqual({ headcount: 5, min: 1_000, q1: 2_000, median: 3_000, average: 4_000, q3: 4_000, max: 10_000, lowerWhisker: 1_000, upperWhisker: 4_000, lowerFence: -1_000, upperFence: 7_000, outlierCount: 1, smallSample: false });
		expect(body.outliers).toEqual({ items: [{ id: id(5), name: base.name, annualBaseUsd: 10_000 }], totalCount: 1, page: 1, pageSize: 25 });
		expect(body.employee).toEqual({ id: id(5), name: base.name, status: "active", annualBaseUsd: 10_000, includedInCohort: true, isOutlier: true });
		expect(body.fxRates).toContainEqual({ currencyCode: "USD", usdRateMicros: 1_000_000, asOfDate: "2026-01-01" });
	});

	it("uses unrounded quartiles/fences when a cent would change the classification", async () => {
		await salaries([1, 1, 2, 3, 4, 8]);
		const { body } = await report().expect(200);
		expect(body.summary).toMatchObject({ q1: 1.25, median: 2.5, q3: 3.75, lowerFence: -2.5, upperFence: 7.5, lowerWhisker: 1, upperWhisker: 4, outlierCount: 1 });
		expect(body.outliers.items).toEqual([{ id: id(6), name: base.name, annualBaseUsd: 8 }]);
		expect(body.summary.average).toBeCloseTo(19 / 6, 10);
	});

	it.each([[1_000, 2_000, 3_000, 4_000], [1_000, 2_000, 3_000, 4_000, 7_000], [1_000, 4_000, 5_000, 6_000, 7_000]].map(values => [values] as const))("interpolates even groups and keeps values exactly on a fence inliers for %j", async values => {
		await salaries(values);
		const { body } = await report().expect(200);
		expect(body.summary.outlierCount).toBe(0);
		expect(body.summary.lowerWhisker).toBe(values[0]); expect(body.summary.upperWhisker).toBe(values.at(-1));
		if (values.length === 4) expect(body.summary).toMatchObject({ q1: 1_750, median: 2_500, q3: 3_250 });
	});

	it.each([[1_000], [1_000, 10_000], [1_000, 1_000, 10_000]].map(values => [values] as const))("shows available statistics and suppresses outlier labels below four employees for %j", async values => {
		await salaries(values);
		const { body } = await report({ employeeId: id(1) }).expect(200);
		expect(body.summary).toMatchObject({ headcount: values.length, min: values[0], max: values.at(-1), smallSample: true, outlierCount: 0 });
		expect(body.employee.isOutlier).toBeNull(); expect(body.outliers.items).toEqual([]);
	});

	it.each([[[2_000, 2_000, 2_000, 2_000], 0], [[2_000, 2_000, 2_000, 2_000, 10_000], 1]])("handles zero IQR and ties for %j", async (values, count) => {
		await salaries(values);
		const { body } = await report().expect(200);
		expect(body.summary).toMatchObject({ q1: 2_000, q3: 2_000, lowerWhisker: 2_000, upperWhisker: 2_000, outlierCount: count });
	});

	it("does not fabricate statistics for empty cohorts, including an empty group with a marker", async () => {
		expect((await report().expect(200)).body).toMatchObject({ summary: null, employee: null, outliers: { items: [], totalCount: 0 } });
		await salaries([1_000]);
		const { body } = await report({ countryCode: "CA", employeeId: id(1) }).expect(200);
		expect(body.summary).toBeNull();
		expect(body.employee).toMatchObject({ annualBaseUsd: 1_000, includedInCohort: false, isOutlier: null });
	});

	it("keeps terminated and outside-filter employee markers without including them in the cohort or labelling them outliers", async () => {
		await salaries([1_000, 2_000, 3_000, 4_000]);
		await context.prisma.employee.create({ data: { ...base, id: id(5), annualBaseMinor: 99_000, status: "terminated" } });
		const terminated = (await report({ employeeId: id(5) }).expect(200)).body;
		expect(terminated.summary).toMatchObject({ headcount: 4, max: 4_000 });
		expect(terminated.employee).toMatchObject({ annualBaseUsd: 99_000, status: "terminated", includedInCohort: false, isOutlier: null });
		await context.prisma.employee.update({ where: { id: id(4) }, data: { department: "Sales" } });
		const outside = (await report({ department: "Engineering", employeeId: id(4) }).expect(200)).body;
		expect(outside.summary.headcount).toBe(3); expect(outside.employee.includedInCohort).toBe(false);
	});

	it("converts current local bases to USD before calculating the distribution and marker", async () => {
		await context.prisma.employee.createMany({ data: [
			{ ...base, id: id(1), countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 10_025 },
			{ ...base, countryCode: "IN", currencyCode: "INR", annualBaseMinor: 1 }, { ...base, annualBaseMinor: 10_000 },
		] });
		const { body } = await report({ employeeId: id(1) }).expect(200);
		expect(body.summary).toMatchObject({ min: 0, q1: 3_709.5, median: 7_419, q3: 8_709.5, max: 10_000 });
		expect(body.employee.annualBaseUsd).toBe(7_419);
	});

	it("paginates all matching outliers in salary/ID order without returning the cohort", async () => {
		await context.prisma.employee.createMany({ data: Array.from({ length: 100 }, () => base) });
		await context.prisma.employee.createMany({ data: Array.from({ length: 27 }, (_, index) => ({ ...base, id: id(index + 1), annualBaseMinor: 10_000 })) });
		const { body } = await report({ page: 2, pageSize: 25 }).expect(200);
		expect(body.summary).toMatchObject({ headcount: 127, outlierCount: 27 });
		expect(body.outliers).toEqual({ items: [26, 27].map(index => ({ id: id(index), name: base.name, annualBaseUsd: 10_000 })), totalCount: 27, page: 2, pageSize: 25 });
		expect(body).not.toHaveProperty("employees");
		expect((await report({ page: 999 }).expect(200)).body.outliers).toMatchObject({ items: [], totalCount: 27 });
	});

	it("excludes history and terminated records, applies all filters, and reflects salary edits", async () => {
		await salaries([1_000, 2_000]);
		await context.prisma.employee.createMany({ data: [{ ...base, countryCode: "CA", currencyCode: "CAD" }, { ...base, department: "Sales" }, { ...base, jobTitle: "Manager" }, { ...base, level: "L2" }, { ...base, status: "terminated" }] });
		await context.prisma.compensationChange.create({ data: { employeeId: id(1), newBaseMinor: 99_000, newBonusBps: 0, newCurrencyCode: "USD" } });
		const query = { countryCode: "US", department: " Engineering ", jobTitle: " Engineer ", level: "L3", employeeId: id(1) };
		expect((await report(query).expect(200)).body.summary.headcount).toBe(2);
		await request(context.app.getHttpServer()).patch(`/api/employees/${id(1)}`).send({ annualBaseMinor: 5_000 }).expect(200);
		const { body } = await report(query).expect(200);
		expect(body.summary).toMatchObject({ min: 2_000, max: 5_000 }); expect(body.employee.annualBaseUsd).toBe(5_000);
	});

	it("preserves literal SQL-like and Unicode filter values", async () => {
		await context.prisma.employee.create({ data: { ...base, department: "研发' OR 1=1 --" } });
		expect((await report({ department: "研发' OR 1=1 --" }).expect(200)).body.summary.headcount).toBe(1);
		expect((await report({ department: "' OR 1=1 --" }).expect(200)).body.summary).toBeNull();
	});

	it.each([{ employeeId: "not-a-uuid" }, { employeeId: [id(1), id(2)] }, { page: 0 }, { page: "1.2" }, { pageSize: 101 }, { status: "all" }, { countryCode: "XX" }, { level: "L7" }, { department: ["a", "b"] }, { jobTitle: "x".repeat(101) }, { metric: "median" }, { dimensions: "country" }])("rejects invalid distribution queries %j", async query => { await report(query).expect(400); });
	it("returns 404 for an unknown comparison employee", async () => { await report({ employeeId: id(999) }).expect(404); });
	it("refuses invalid FX configuration", async () => { await context.prisma.fxRate.update({ where: { currencyCode: "USD" }, data: { usdRateMicros: 0 } }); await report().expect(503); });
});
