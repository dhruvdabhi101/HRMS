import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { EmployeesModule } from "../../src/employees/employees.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestDatabase } from "../helpers/test-database";

describe("employee directory API", () => {
	let app: INestApplication;
	let database: Awaited<ReturnType<typeof createTestDatabase>>;
	const ids = [1, 2, 3, 4, 5].map((value) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`);

	beforeEach(async () => {
		database = await createTestDatabase();
		await database.prisma.fxRate.createMany({ data: [
			{ currencyCode: "USD", usdRateMicros: 1_000_000, asOfDate: new Date("2026-01-01") },
			{ currencyCode: "CAD", usdRateMicros: 740_000, asOfDate: new Date("2026-01-01") },
		] });
		const base = { countryCode: "US", currencyCode: "USD", department: "Engineering", jobTitle: "Engineer", level: "L3", gender: "woman" as const, hireDate: new Date("2024-01-01"), annualBaseMinor: 10_000_000, bonusTargetBps: 1_000 };
		await database.prisma.employee.createMany({ data: [
			{ ...base, id: ids[1], name: "Asha" },
			{ ...base, id: ids[0], name: "Asha" },
			{ ...base, id: ids[2], name: "Bob 100%_ O'Neil", department: "Sales", jobTitle: "Account Manager", level: "L2" },
			{ ...base, id: ids[3], name: "Zoë", countryCode: "CA", currencyCode: "CAD", department: "Sales", level: "L2", status: "terminated" },
			{ ...base, id: ids[4], name: "李明", jobTitle: "Director", level: "L6" },
		] });
		const module = await Test.createTestingModule({ imports: [EmployeesModule] }).overrideProvider(PrismaService).useValue(database.prisma).compile();
		app = module.createNestApplication({ logger: false });
		app.setGlobalPrefix("api");
		app.useGlobalPipes(createValidationPipe());
		app.useGlobalFilters(new GlobalExceptionFilter());
		await app.init();
	});

	afterEach(async () => { await app?.close(); await database?.close(); });
	const list = (query = {}) => request(app.getHttpServer()).get("/api/employees").query(query).expect(200);

	it("defaults to active employees, 25 per page, with stable name/id ordering and compact records", async () => {
		const { body } = await list();
		expect(body).toMatchObject({ totalCount: 4, page: 1, pageSize: 25 });
		expect(body.items.map((item: { id: string }) => item.id)).toEqual([ids[0], ids[1], ids[2], ids[4]]);
		expect(body.items[0]).toMatchObject({ name: "Asha", annualBaseMinor: 10_000_000, currencyCode: "USD" });
		expect(body.items[0]).not.toHaveProperty("compensationChanges");
	});

	it("paginates without duplicates and preserves total count on out-of-range pages", async () => {
		const first = await list({ pageSize: 2 });
		const second = await list({ pageSize: 2, page: 2 });
		expect(first.body.items.map((item: { id: string }) => item.id)).toEqual([ids[0], ids[1]]);
		expect(second.body.items.map((item: { id: string }) => item.id)).toEqual([ids[2], ids[4]]);
		const beyond = await list({ page: 100 });
		expect(beyond.body).toMatchObject({ items: [], totalCount: 4, page: 100 });
	});

	it("supports terminated and all views with accurate counts", async () => {
		expect((await list({ status: "terminated" })).body).toMatchObject({ totalCount: 1, items: [{ id: ids[3] }] });
		expect((await list({ status: "all" })).body.totalCount).toBe(5);
	});

	it.each([["  ASH  ", 2], ["%_", 1], ["O'Neil", 1], ["李", 1], ["' OR 1=1 --", 0], ["missing", 0]])("searches literal name substring %s", async (search, totalCount) => {
		expect((await list({ search })).body.totalCount).toBe(totalCount);
	});

	it("combines every filter with AND and returns empty results without changing counts", async () => {
		const query = { countryCode: "US", department: " Sales ", jobTitle: "Account Manager", level: "L2", search: "Bob", status: "all" };
		expect((await list(query)).body).toMatchObject({ totalCount: 1, items: [{ id: ids[2] }] });
		expect((await list({ ...query, countryCode: "IN" })).body).toMatchObject({ items: [], totalCount: 0 });
	});

	it.each([
		[{ countryCode: "CA", status: "all" }, [3]],
		[{ department: "Sales" }, [2]],
		[{ jobTitle: "Director" }, [4]],
		[{ level: "L3" }, [0, 1]],
		[{ department: "Sales", level: "L3" }, []],
		[{ search: "Bob", department: "Engineering" }, []],
		[{ department: "Sales' OR 1=1 --" }, []],
	])("applies each exact filter and their intersections: %j", async (query, indexes) => {
		const { body } = await list(query);
		expect(body.items.map((item: { id: string }) => item.id)).toEqual(indexes.map((index) => ids[index]));
		expect(body.totalCount).toBe(indexes.length);
	});

	it.each(["countryCode", "department", "jobTitle", "level", "name"])("sorts %s in both directions with an id tie-breaker", async (sortBy) => {
		for (const sortDirection of ["asc", "desc"]) {
			const { body } = await list({ sortBy, sortDirection });
			const values = body.items.map((item: Record<string, string>) => item[sortBy]);
			const expected = [...values].sort();
			if (sortDirection === "desc") expected.reverse();
			expect(values).toEqual(expected);
			const duplicates = body.items.filter((item: { name: string }) => item.name === "Asha");
			expect(duplicates.map((item: { id: string }) => item.id)).toEqual([ids[0], ids[1]]);
		}
	});

	it.each([
		{ page: 0 }, { page: -1 }, { page: 1.5 }, { page: "abc" }, { page: "1e2" }, { page: "" }, { page: "9007199254740992" },
		{ pageSize: 0 }, { pageSize: 101 }, { pageSize: "25abc" }, { pageSize: ["25", "50"] },
		{ countryCode: "XX" }, { level: "L7" }, { status: "deleted" }, { sortBy: "annualBaseMinor; DROP TABLE Employee" }, { sortDirection: "up" },
		{ search: ["Asha", "Bob"] }, { search: "a".repeat(121) }, { department: "x".repeat(101) }, { unknown: "value" },
	])("rejects malformed query %j", async (query) => {
		const { body } = await request(app.getHttpServer()).get("/api/employees").query(query).expect(400);
		expect(Object.keys(body.fieldErrors).length).toBeGreaterThan(0);
	});

	it("returns sorted distinct suggestions across statuses, including an empty database", async () => {
		const response = await request(app.getHttpServer()).get("/api/employees/filter-options").expect(200);
		expect(response.body).toEqual({ departments: ["Engineering", "Sales"], jobTitles: ["Account Manager", "Director", "Engineer"] });
		await database.prisma.employee.deleteMany();
		expect((await request(app.getHttpServer()).get("/api/employees/filter-options").expect(200)).body).toEqual({ departments: [], jobTitles: [] });
		expect((await list()).body).toMatchObject({ items: [], totalCount: 0 });
	});
});
