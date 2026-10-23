import { PrismaService } from "../prisma/prisma.service";
import { createSeedData } from "./seed-data";

export async function seedDatabase(
	prisma: PrismaService,
	data: ReturnType<typeof createSeedData>,
) {
	await prisma.$transaction(
		async (transaction) => {
			if (
				(await transaction.employee.count()) ||
				(await transaction.compensationChange.count()) ||
				(await transaction.fxRate.count())
			) {
				throw new Error(
					"Seeding requires an empty database; existing data was not changed.",
				);
			}
			await transaction.fxRate.createMany({ data: data.fxRates });
			for (let offset = 0; offset < data.employees.length; offset += 100) {
				await transaction.employee.createMany({
					data: data.employees.slice(offset, offset + 100),
				});
			}
			for (let offset = 0; offset < data.history.length; offset += 100) {
				await transaction.compensationChange.createMany({
					data: data.history.slice(offset, offset + 100),
				});
			}
		},
		{ timeout: 60_000 },
	);
}
