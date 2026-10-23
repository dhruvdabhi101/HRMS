import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { EmployeeDetail } from "@repo/shared";
import request from "supertest";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { EmployeesModule } from "../../src/employees/employees.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestDatabase } from "../helpers/test-database";

const input = {
	name: "Asha Rao", countryCode: "IN", department: "Engineering",
	jobTitle: "Engineer", level: "L3", gender: "woman",
	hireDate: "2024-02-29", annualBaseMinor: 100_000, bonusTargetBps: 1_000,
};
const unknownId = "00000000-0000-4000-8000-000000000001";

describe("employee edits and termination", () => {
	let app: INestApplication;
	let database: Awaited<ReturnType<typeof createTestDatabase>>;
	let employee: EmployeeDetail;
	const detail = () => request(app.getHttpServer()).get(`/api/employees/${employee.id}`).expect(200);
	const update = (body: object) => request(app.getHttpServer()).patch(`/api/employees/${employee.id}`).send(body);
	const terminate = () => request(app.getHttpServer()).delete(`/api/employees/${employee.id}`);

	beforeEach(async () => {
		database = await createTestDatabase();
		await database.prisma.fxRate.createMany({ data: [
			{ currencyCode: "INR", usdRateMicros: 12_000, asOfDate: new Date("2026-01-01") },
			{ currencyCode: "USD", usdRateMicros: 1_000_000, asOfDate: new Date("2026-01-01") },
		] });
		const module = await Test.createTestingModule({ imports: [EmployeesModule] })
			.overrideProvider(PrismaService).useValue(database.prisma).compile();
		app = module.createNestApplication({ logger: false });
		app.setGlobalPrefix("api");
		app.useGlobalPipes(createValidationPipe());
		app.useGlobalFilters(new GlobalExceptionFilter());
		await app.init();
		employee = (await request(app.getHttpServer()).post("/api/employees").send(input).expect(201)).body;
	});

	afterEach(async () => { await app?.close(); await database?.close(); });

	it("edits all profile fields, trims text, preserves omitted pay, and adds no compensation history", async () => {
		const profile = { name: "  李明 O'Neil  ", department: " Sales ", jobTitle: " Director ", level: "L6", gender: "undisclosed", hireDate: "2023-01-02" };
		const { body } = await update(profile).expect(200);
		expect(body).toMatchObject({ ...profile, name: "李明 O'Neil", department: "Sales", jobTitle: "Director", annualBaseMinor: 100_000, bonusTargetBps: 1_000, currencyCode: "INR", status: "active" });
		expect(body.compensationChanges).toEqual(employee.compensationChanges);
		expect((await detail()).body).toEqual(body);
	});

	it.each([
		[{ annualBaseMinor: 110_005 }, 110_005, 1_000, 11_001, 121_006],
		[{ bonusTargetBps: 0 }, 100_000, 0, 0, 100_000],
		[{ annualBaseMinor: 1, bonusTargetBps: 10_000 }, 1, 10_000, 1, 2],
		[{ annualBaseMinor: 1_000_000_000, bonusTargetBps: 10_000 }, 1_000_000_000, 10_000, 1_000_000_000, 2_000_000_000],
	])("records a complete previous/new snapshot for pay update %j", async (patch, annualBaseMinor, bonusTargetBps, bonusMinor, targetMinor) => {
		const { body } = await update(patch).expect(200);
		expect(body).toMatchObject({ annualBaseMinor, bonusTargetBps, bonusMinor, targetMinor });
		expect(body.compensationChanges).toHaveLength(2);
		expect(body.compensationChanges[0]).toMatchObject({ oldBaseMinor: 100_000, newBaseMinor: annualBaseMinor, oldBonusBps: 1_000, newBonusBps: bonusTargetBps, oldCurrencyCode: "INR", newCurrencyCode: "INR" });
		expect(body.compensationChanges[1]).toEqual(employee.compensationChanges[0]);
		expect(Number.isNaN(Date.parse(body.compensationChanges[0].changedAt))).toBe(false);
		expect((await detail()).body).toEqual(body);
	});

	it.each([{}, { annualBaseMinor: 100_000.00 }, { bonusTargetBps: 1_000 }, { name: " Asha Rao " }, { countryCode: "IN", currencyCode: "INR" }, input])("rejects an unchanged save %j without touching timestamps or history", async (patch) => {
		const { body } = await update(patch).expect(400);
		expect(body.message).toMatch(/no changes/i);
		expect((await detail()).body).toEqual(employee);
	});

	it("allows profile edits with identical compensation and records a later reversion as a real pay change", async () => {
		const renamed = await update({ ...input, name: "Asha Shah" }).expect(200);
		expect(renamed.body.compensationChanges).toHaveLength(1);
		await update({ annualBaseMinor: 120_000 }).expect(200);
		const { body } = await update({ annualBaseMinor: 100_000 }).expect(200);
		expect(body.compensationChanges).toHaveLength(3);
		expect(body.compensationChanges[0]).toMatchObject({ oldBaseMinor: 120_000, newBaseMinor: 100_000 });
	});

	it.each([{ countryCode: "US" }, { countryCode: "US", annualBaseMinor: 120_000 }, { countryCode: "US", bonusTargetBps: 1_000 }])("requires explicit base and bonus when changing currency: %j", async (patch) => {
		const { body } = await update(patch).expect(400);
		if (!("annualBaseMinor" in patch)) expect(body.fieldErrors.annualBaseMinor).toBeTruthy();
		if (!("bonusTargetBps" in patch)) expect(body.fieldErrors.bonusTargetBps).toBeTruthy();
		expect((await detail()).body).toEqual(employee);
	});

	it("changes currency without converting amounts and preserves original currencies throughout history", async () => {
		const { body } = await update({ countryCode: "US", annualBaseMinor: 100_000, bonusTargetBps: 1_000 }).expect(200);
		expect(body).toMatchObject({ countryCode: "US", currencyCode: "USD", annualBaseMinor: 100_000 });
		expect(body.compensationChanges).toHaveLength(2);
		expect(body.compensationChanges[0]).toMatchObject({ oldBaseMinor: 100_000, newBaseMinor: 100_000, oldBonusBps: 1_000, newBonusBps: 1_000, oldCurrencyCode: "INR", newCurrencyCode: "USD" });
		expect(body.compensationChanges[1].newCurrencyCode).toBe("INR");
	});

	it.each([
		["name", " "], ["name", "x".repeat(121)], ["department", "x".repeat(101)], ["jobTitle", ""],
		["countryCode", "XX"], ["level", "L7"], ["gender", "unknown"],
		["hireDate", "2025-02-29"], ["hireDate", "9999-01-01"], ["hireDate", "2024-02-29T00:00:00Z"],
		["annualBaseMinor", 0], ["annualBaseMinor", -1], ["annualBaseMinor", 1_000_000_001], ["annualBaseMinor", 1.5], ["annualBaseMinor", "100000"],
		["bonusTargetBps", -1], ["bonusTargetBps", 10_001], ["bonusTargetBps", 0.5], ["bonusTargetBps", "1000"],
		["currencyCode", "USD"], ["status", "terminated"], ["id", unknownId], ["compensationChanges", []],
	])("rejects invalid or protected %s=%j atomically", async (field, value) => {
		const { body } = await update({ name: "Changed", [field]: value }).expect(400);
		expect(body.fieldErrors[field]).toEqual(expect.any(String));
		expect((await detail()).body).toEqual(employee);
	});

	it.each([...Object.keys(input), "currencyCode"])("rejects explicit null for %s rather than treating it as omitted", async (field) => {
		const { body } = await update({ name: "Changed", [field]: null }).expect(400);
		expect(body.fieldErrors[field]).toBeTruthy();
		expect((await detail()).body).toEqual(employee);
	});

	it("rejects an unconfigured destination currency and keeps profile, pay and history intact", async () => {
		const { body } = await update({ countryCode: "CA", annualBaseMinor: 150_000, bonusTargetBps: 0 }).expect(400);
		expect(body.fieldErrors.countryCode).toBeTruthy();
		expect((await detail()).body).toEqual(employee);
	});

	it("rolls back both profile and compensation if inserting history fails", async () => {
		await database.prisma.$executeRawUnsafe(`CREATE TRIGGER reject_history BEFORE INSERT ON CompensationChange BEGIN SELECT RAISE(ABORT, 'history unavailable'); END`);
		await update({ name: "Changed", countryCode: "US", annualBaseMinor: 120_000, bonusTargetBps: 0 }).expect(500);
		expect((await detail()).body).toEqual(employee);
		expect(await database.prisma.compensationChange.count()).toBe(1);
	});

	it("keeps history newest first with descending IDs when timestamps tie", async () => {
		await update({ annualBaseMinor: 120_000 }).expect(200);
		await update({ bonusTargetBps: 0 }).expect(200);
		await database.prisma.compensationChange.updateMany({ data: { changedAt: new Date("2026-01-01") } });
		const { body } = await detail();
		const ids = body.compensationChanges.map((change: { id: string }) => change.id);
		expect(ids).toHaveLength(3);
		expect(ids).toEqual([...ids].sort().reverse());
	});

	it("soft terminates, preserves all pay/history, and repeated termination makes no further changes", async () => {
		await update({ annualBaseMinor: 120_000 }).expect(200);
		const before = (await detail()).body;
		const { body } = await terminate().expect(200);
		expect(body).toEqual({ ...before, status: "terminated", updatedAt: expect.any(String) });
		expect((await terminate().expect(200)).body).toEqual(body);
		expect((await detail()).body).toEqual(body);
		expect(await database.prisma.employee.count()).toBe(1);
		expect(await database.prisma.compensationChange.count()).toBe(2);
	});

	it.each([{ annualBaseMinor: 120_000 }, { bonusTargetBps: 0 }, { countryCode: "US", annualBaseMinor: 120_000, bonusTargetBps: 0 }, { name: "Changed" }, {}])("rejects edits to a terminated employee: %j", async (patch) => {
		await database.prisma.employee.update({ where: { id: employee.id }, data: { status: "terminated" } });
		const before = (await detail()).body;
		await update(patch).expect(409);
		expect((await detail()).body).toEqual(before);
	});

	it("updates directory values and suggestions, and moves terminated records out of the default view", async () => {
		await update({ name: "Updated", department: "Sales", annualBaseMinor: 120_000 }).expect(200);
		const list = () => request(app.getHttpServer()).get("/api/employees");
		expect((await list().query({ search: "Asha" }).expect(200)).body.totalCount).toBe(0);
		expect((await list().query({ department: "Sales" }).expect(200)).body).toMatchObject({ totalCount: 1, items: [{ id: employee.id, name: "Updated", annualBaseMinor: 120_000 }] });
		expect((await request(app.getHttpServer()).get("/api/employees/filter-options").expect(200)).body.departments).toEqual(["Sales"]);
		await terminate().expect(200);
		expect((await list().expect(200)).body).toMatchObject({ totalCount: 0, items: [] });
		expect((await list().query({ status: "terminated" }).expect(200)).body).toMatchObject({ totalCount: 1, items: [{ id: employee.id }] });
		expect((await list().query({ status: "all" }).expect(200)).body.totalCount).toBe(1);
	});

	it.each(["patch", "delete"] as const)("returns 404 for a missing employee and 400 for a malformed ID on %s", async (method) => {
		await request(app.getHttpServer())[method](`/api/employees/${unknownId}`).send({ name: "Changed" }).expect(404);
		await request(app.getHttpServer())[method]("/api/employees/not-a-uuid").send({ name: "Changed" }).expect(400);
		expect((await detail()).body).toEqual(employee);
	});
});
