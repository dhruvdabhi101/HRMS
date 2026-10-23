import { createSeedData } from "../../src/seed/seed-data";
import { seedDatabase } from "../../src/seed/seed-database";
import { createTestDatabase } from "../helpers/test-database";

describe("SQLite seed persistence", () => {
	let database: Awaited<ReturnType<typeof createTestDatabase>>;

	beforeEach(async () => {
		database = await createTestDatabase();
	});

	afterEach(async () => {
		await database?.close();
	});

	it("persists employees, initial history and the fixed FX table, and refuses a rerun without changing data", async () => {
		const data = createSeedData(12);
		await seedDatabase(database.prisma, data);
		const employee = await database.prisma.employee.findUniqueOrThrow({
			where: { id: data.employees[0].id },
			include: { compensationChanges: true, currency: true },
		});
		expect(employee).toMatchObject(data.employees[0]);
		expect(employee.compensationChanges).toEqual([data.history[0]]);
		expect(employee.currency).toEqual(data.fxRates[0]);
		await expect(seedDatabase(database.prisma, data)).rejects.toThrow("empty database");
		expect(await database.prisma.employee.count()).toBe(12);
		expect(await database.prisma.compensationChange.count()).toBe(12);
		expect(await database.prisma.fxRate.count()).toBe(5);
		expect(await database.prisma.employee.findUnique({ where: { id: employee.id } })).toEqual(data.employees[0]);
	});

	it("refuses to overwrite an existing FX table even when no employees exist", async () => {
		const data = createSeedData(2);
		const customRate = { ...data.fxRates[0], usdRateMicros: 999_999 };
		await database.prisma.fxRate.create({ data: customRate });
		await expect(seedDatabase(database.prisma, data)).rejects.toThrow("empty database");
		expect(await database.prisma.fxRate.findMany()).toEqual([customRate]);
		expect(await database.prisma.employee.count()).toBe(0);
	});

	it("rolls back all seed writes if a history row references a missing employee", async () => {
		const data = createSeedData(2);
		data.history[1].employeeId = "missing-employee";
		await expect(seedDatabase(database.prisma, data)).rejects.toMatchObject({ code: "P2003" });
		expect(await database.prisma.fxRate.count()).toBe(0);
		expect(await database.prisma.employee.count()).toBe(0);
		expect(await database.prisma.compensationChange.count()).toBe(0);
	});

	it("prevents physical deletion of an employee with history or a referenced FX rate", async () => {
		const data = createSeedData(2);
		await seedDatabase(database.prisma, data);
		await expect(database.prisma.employee.delete({ where: { id: data.employees[0].id } })).rejects.toMatchObject({ code: "P2003" });
		await expect(database.prisma.fxRate.delete({ where: { currencyCode: "USD" } })).rejects.toMatchObject({ code: "P2003" });
		expect(await database.prisma.employee.count()).toBe(2);
		expect(await database.prisma.compensationChange.count()).toBe(2);
	});
});
