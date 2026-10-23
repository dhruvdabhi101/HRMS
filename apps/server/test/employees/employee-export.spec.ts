import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { EmployeesModule } from "../../src/employees/employees.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { parseCsv } from "../helpers/csv";
import { createTestDatabase } from "../helpers/test-database";

const ids = [1, 2, 3, 4].map(value => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`);
const base = { name: "Asha", countryCode: "US", currencyCode: "USD", department: "Engineering", jobTitle: "Engineer", level: "L3", gender: "woman" as const, hireDate: new Date("2024-02-29"), annualBaseMinor: 10_005, bonusTargetBps: 1_000 };
const headers = ["Employee ID", "Name", "Country code", "Department", "Job title", "Level", "Gender", "Hire date", "Status", "Currency", "Annual base salary (local)", "Bonus target (%)", "Target bonus (local)", "Annual target compensation (local)"];

describe("filtered employee CSV export", () => {
	let app: INestApplication;
	let database: Awaited<ReturnType<typeof createTestDatabase>>;
	const exportCsv = (query = {}) => request(app.getHttpServer()).get("/api/employees/export").query(query);

	beforeEach(async () => {
		database = await createTestDatabase();
		await database.prisma.fxRate.createMany({ data: [
			{ currencyCode: "USD", usdRateMicros: 1_000_000, asOfDate: new Date("2026-01-01") },
			{ currencyCode: "CAD", usdRateMicros: 740_000, asOfDate: new Date("2026-01-01") },
		] });
		await database.prisma.employee.createMany({ data: [
			{ ...base, id: ids[0] },
			{ ...base, id: ids[1], name: 'Bob 100%_ O\'Neil, "Jr"', department: "Sales", jobTitle: "Account Manager", level: "L2", annualBaseMinor: 1, bonusTargetBps: 0 },
			{ ...base, id: ids[2], name: "李明", countryCode: "CA", currencyCode: "CAD", annualBaseMinor: 10_025, bonusTargetBps: 10_000 },
			{ ...base, id: ids[3], status: "terminated" },
		] });
		const module = await Test.createTestingModule({ imports: [EmployeesModule] }).overrideProvider(PrismaService).useValue(database.prisma).compile();
		app = module.createNestApplication({ logger: false });
		app.setGlobalPrefix("api");
		app.useGlobalPipes(createValidationPipe());
		app.useGlobalFilters(new GlobalExceptionFilter());
		await app.listen(0, "127.0.0.1");
	});
	afterEach(async () => { await app?.close(); await database?.close(); });

	it("downloads active employees as UTF-8 CSV with a fixed filename and explicit annual/local compensation labels", async () => {
		const response = await exportCsv().expect(200);
		expect(response.headers["content-type"]).toMatch(/^text\/csv; charset=utf-8/i);
		expect(response.headers["content-disposition"]).toBe('attachment; filename="employees.csv"');
		expect(response.headers["cache-control"]).toBe("no-store");
		const rows = parseCsv(response.text);
		expect(rows[0]).toEqual(headers);
		expect(rows.slice(1).map(row => row[0])).toEqual(ids.slice(0, 3));
		expect(rows[1]).toEqual([ids[0], "Asha", "US", "Engineering", "Engineer", "L3", "woman", "2024-02-29", "active", "USD", "100.05", "10.00", "10.01", "110.06"]);
		expect(rows[2].slice(10)).toEqual(["0.01", "0.00", "0.00", "0.01"]);
		expect(rows[3].slice(9)).toEqual(["CAD", "100.25", "100.00", "100.25", "200.50"]);
	});

	it("includes every match beyond the maximum directory page size and ignores valid page/pageSize", async () => {
		await database.prisma.employee.createMany({ data: Array.from({ length: 101 }, (_, index) => ({ ...base, name: `Extra ${index}` })) });
		const { text } = await exportCsv({ page: 999, pageSize: 1 }).expect(200);
		const rows = parseCsv(text).slice(1);
		expect(rows).toHaveLength(104);
		expect(new Set(rows.map(row => row[0])).size).toBe(104);
		expect(rows.some(row => row[0] === ids[3])).toBe(false);
	});

	it.each([
		[{}, [0, 1, 2]],
		[{ status: "all" }, [0, 3, 1, 2]],
		[{ status: "terminated" }, [3]],
		[{ countryCode: "CA" }, [2]],
		[{ department: " Sales " }, [1]],
		[{ jobTitle: "Account Manager" }, [1]],
		[{ level: "L3" }, [0, 2]],
		[{ search: " ASH " }, [0]],
		[{ search: "%_" }, [1]],
		[{ search: "O'Neil" }, [1]],
		[{ search: "李" }, [2]],
		[{ status: "all", countryCode: "US", department: "Engineering", jobTitle: "Engineer", level: "L3", search: "Asha" }, [0, 3]],
		[{ countryCode: "CA", department: "Sales" }, []],
		[{ search: "' OR 1=1 --" }, []],
		[{ department: "Sales' OR 1=1 --" }, []],
		[{ search: "missing" }, []],
	])("uses exactly the directory selection and stable ordering for %j", async (query, indexes) => {
		const rows = parseCsv((await exportCsv(query).expect(200)).text);
		expect(rows[0]).toEqual(headers);
		expect(rows.slice(1).map(row => row[0])).toEqual(indexes.map(index => ids[index]));
		const { body } = await request(app.getHttpServer()).get("/api/employees").query({ ...query, pageSize: 100 }).expect(200);
		expect(rows.slice(1).map(row => row[0])).toEqual(body.items.map((item: { id: string }) => item.id));
	});

	it("preserves descending sort with an ascending ID tie-breaker", async () => {
		const rows = parseCsv((await exportCsv({ status: "all", sortBy: "name", sortDirection: "desc" }).expect(200)).text);
		expect(rows.slice(1).map(row => row[0])).toEqual([ids[2], ids[1], ids[0], ids[3]]);
	});

	it("returns just the header for an empty database", async () => {
		await database.prisma.employee.deleteMany();
		expect(parseCsv((await exportCsv().expect(200)).text)).toEqual([headers]);
	});

	it("round-trips commas, doubled quotes, CR/LF, semicolons, Unicode and formula text inside one cell", async () => {
		const name = '李明, "Jr"\r\nO\'Neil; =1+1';
		const department = 'Research\n"Development", Sales';
		await database.prisma.employee.update({ where: { id: ids[0] }, data: { name, department, jobTitle: 'Lead\rEngineer' } });
		const { text } = await exportCsv({ search: "李明," }).expect(200);
		const rows = parseCsv(text);
		expect(rows).toHaveLength(2);
		expect(rows[1]).toHaveLength(headers.length);
		expect(rows[1].slice(1, 5)).toEqual([name, "US", department, "Lead\rEngineer"]);
		expect(text).toContain('"李明, ""Jr""\r\nO\'Neil; =1+1"');
	});

	it.each(["=1+1", "+1+1", "-1+1", "@SUM(1)", "\t=1+1", "\r=1+1", "\n=1+1", "  =1+1", "\uFEFF=1+1", "\u0000=1+1", "＝1+1", "＋1+1", "－1+1", "＠SUM(1)", '=1+1",=2+2'])
	("exports formula-like text %j as a literal in every free-text column", async value => {
		await database.prisma.employee.update({ where: { id: ids[0] }, data: { name: value, department: value, jobTitle: value } });
		const rows = parseCsv((await exportCsv().expect(200)).text);
		const row = rows.find(row => row[0] === ids[0]);
		expect(row).toHaveLength(headers.length);
		for (const index of [1, 3, 4]) expect(row?.[index]).toBe(`'${value}`);
		expect(rows).toHaveLength(4);
	});

	it.each([{ countryCode: "XX" }, { level: "L7" }, { status: "deleted" }, { sortBy: "name; DROP TABLE Employee" }, { sortDirection: "up" }, { page: 0 }, { pageSize: 101 }, { search: ["Asha", "Bob"] }, { search: "x".repeat(121) }, { department: "x".repeat(101) }, { unknown: "value" }])
	("rejects invalid export query %j as JSON, not a downloadable CSV", async query => {
		const response = await exportCsv(query).expect(400);
		expect(response.headers["content-type"]).toMatch(/application\/json/);
		expect(response.headers["content-disposition"]).toBeUndefined();
		expect(Object.keys(response.body.fieldErrors).length).toBeGreaterThan(0);
		expect(await database.prisma.employee.count()).toBe(4);
	});

	it("exports current compensation after an edit and respects termination without altering records", async () => {
		await request(app.getHttpServer()).patch(`/api/employees/${ids[0]}`).send({ annualBaseMinor: 20_001, bonusTargetBps: 500 }).expect(200);
		await request(app.getHttpServer()).delete(`/api/employees/${ids[0]}`).expect(200);
		expect(parseCsv((await exportCsv().expect(200)).text).slice(1).map(row => row[0])).toEqual([ids[1], ids[2]]);
		const row = parseCsv((await exportCsv({ status: "terminated", search: "Asha" }).expect(200)).text)[1];
		expect(row.slice(8)).toEqual(["terminated", "USD", "200.01", "5.00", "10.00", "210.01"]);
		expect(await database.prisma.employee.count()).toBe(4);
		expect(await database.prisma.compensationChange.count()).toBe(1);
	});
});
