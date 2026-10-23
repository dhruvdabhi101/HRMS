import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { EmployeesModule } from "../../src/employees/employees.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestDatabase } from "../helpers/test-database";

const validEmployee = {
	name: "  Asha Rao  ", countryCode: "IN", department: " Engineering ",
	jobTitle: "Software Engineer", level: "L3", gender: "woman",
	hireDate: "2024-02-29", annualBaseMinor: 100_000_000, bonusTargetBps: 1_000,
};

describe("employee create/detail API", () => {
	let app: INestApplication;
	let database: Awaited<ReturnType<typeof createTestDatabase>>;

	beforeEach(async () => {
		database = await createTestDatabase();
		await database.prisma.fxRate.create({ data: { currencyCode: "INR", usdRateMicros: 12_000, asOfDate: new Date("2026-01-01") } });
		const module = await Test.createTestingModule({ imports: [EmployeesModule] })
			.overrideProvider(PrismaService).useValue(database.prisma).compile();
		app = module.createNestApplication({ logger: false });
		app.setGlobalPrefix("api");
		app.useGlobalPipes(createValidationPipe());
		app.useGlobalFilters(new GlobalExceptionFilter());
		await app.init();
	});

	afterEach(async () => {
		await app?.close();
		await database?.close();
	});

	it("creates active employees with trimmed fields, derived currency and one complete initial history entry", async () => {
		const { body } = await request(app.getHttpServer()).post("/api/employees").send(validEmployee).expect(201);
		expect(body).toMatchObject({ ...validEmployee, name: "Asha Rao", department: "Engineering", currencyCode: "INR", status: "active", bonusMinor: 10_000_000, targetMinor: 110_000_000 });
		expect(body.hireDate).toBe("2024-02-29");
		expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
		const detail = await request(app.getHttpServer()).get(`/api/employees/${body.id}`).expect(200);
		expect(detail.body).toEqual(body);
		expect(body.compensationChanges).toHaveLength(1);
		expect(body.compensationChanges[0]).toMatchObject({ oldBaseMinor: null, oldBonusBps: null, oldCurrencyCode: null, newBaseMinor: 100_000_000, newBonusBps: 1_000, newCurrencyCode: "INR" });
		expect(await database.prisma.employee.count()).toBe(1);
		expect(await database.prisma.compensationChange.count()).toBe(1);
	});

	it.each([
		["name", " "], ["name", 123], ["department", ""], ["jobTitle", "x".repeat(101)],
		["countryCode", "XX"], ["level", "L7"], ["gender", "unknown"],
		["hireDate", "2025-02-29"], ["hireDate", "9999-01-01"], ["hireDate", "2024-02-29T12:00:00Z"],
		["annualBaseMinor", 0], ["annualBaseMinor", 1_000_000_001], ["annualBaseMinor", 100.5], ["annualBaseMinor", "10000"],
		["bonusTargetBps", -1], ["bonusTargetBps", 10_001], ["bonusTargetBps", 1.5],
		["currencyCode", "USD"], ["currencyCode", null],
	])("rejects invalid %s=%s with a field error and no persisted records", async (field, value) => {
		const response = await request(app.getHttpServer()).post("/api/employees").send({ ...validEmployee, [field]: value }).expect(400);
		expect(response.body.fieldErrors[field]).toEqual(expect.any(String));
		expect(await database.prisma.employee.count()).toBe(0);
		expect(await database.prisma.compensationChange.count()).toBe(0);
	});

	it("rejects missing required fields and does not allow callers to set status", async () => {
		const missing = await request(app.getHttpServer()).post("/api/employees").send({ name: "Asha" }).expect(400);
		expect(missing.body.fieldErrors.annualBaseMinor).toBeTruthy();
		const extra = await request(app.getHttpServer()).post("/api/employees").send({ ...validEmployee, status: "terminated" }).expect(400);
		expect(extra.body.fieldErrors.status).toBeTruthy();
		expect(await database.prisma.employee.count()).toBe(0);
	});

	it("accepts zero bonus and maximum valid compensation without coercion", async () => {
		for (const bonusTargetBps of [0, 10_000]) {
			await request(app.getHttpServer()).post("/api/employees").send({ ...validEmployee, annualBaseMinor: 1_000_000_000, bonusTargetBps }).expect(201);
		}
		expect(await database.prisma.employee.count()).toBe(2);
	});

	it.each(Object.keys(validEmployee))("rejects missing or null required create field %s without partial records", async (field) => {
		const missing: Record<string, unknown> = { ...validEmployee };
		delete missing[field];
		for (const payload of [missing, { ...validEmployee, [field]: null }]) {
			const { body } = await request(app.getHttpServer()).post("/api/employees").send(payload).expect(400);
			expect(body.fieldErrors[field]).toBeTruthy();
		}
		expect(await database.prisma.employee.count()).toBe(0);
		expect(await database.prisma.compensationChange.count()).toBe(0);
	});

	it("preserves non-Latin names and punctuation at the minimum salary boundary", async () => {
		const { body } = await request(app.getHttpServer()).post("/api/employees").send({ ...validEmployee, name: " 李明 O'Neil ", annualBaseMinor: 1, bonusTargetBps: 0 }).expect(201);
		expect(body).toMatchObject({ name: "李明 O'Neil", annualBaseMinor: 1, bonusMinor: 0, targetMinor: 1 });
	});

	it("rejects malformed detail IDs", async () => {
		await request(app.getHttpServer()).get("/api/employees/not-a-uuid").expect(400);
	});

	it("returns 404 for an unknown employee", async () => {
		await request(app.getHttpServer()).get("/api/employees/00000000-0000-4000-8000-000000000001").expect(404);
	});

	it("rolls back employee creation when initial history cannot be written", async () => {
		await database.prisma.$executeRawUnsafe(`CREATE TRIGGER reject_history BEFORE INSERT ON CompensationChange BEGIN SELECT RAISE(ABORT, 'history unavailable'); END`);
		await request(app.getHttpServer()).post("/api/employees").send(validEmployee).expect(500);
		expect(await database.prisma.employee.count()).toBe(0);
		expect(await database.prisma.compensationChange.count()).toBe(0);
	});

	it("rejects creation clearly when the country's FX record has not been configured", async () => {
		const response = await request(app.getHttpServer()).post("/api/employees").send({ ...validEmployee, countryCode: "US" }).expect(400);
		expect(response.body.fieldErrors.countryCode).toBeTruthy();
		expect(await database.prisma.employee.count()).toBe(0);
	});
});
