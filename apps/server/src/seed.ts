import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { PrismaService } from "./prisma/prisma.service";
import { SEED_EMPLOYEE_COUNT } from "./seed/seed.constants";
import { createSeedData } from "./seed/seed-data";
import { seedDatabase } from "./seed/seed-database";

async function main() {
	const application = await NestFactory.createApplicationContext(PrismaModule);
	try {
		const prisma = application.get(PrismaService);
		await seedDatabase(prisma, createSeedData(SEED_EMPLOYEE_COUNT));
		Logger.log(
			`Seeded ${SEED_EMPLOYEE_COUNT} synthetic employees with initial history and demo FX rates.`,
			"Seed",
		);
	} finally {
		await application.close();
	}
}

main().catch((error: unknown) => {
	Logger.error(
		error instanceof Error ? error.message : String(error),
		undefined,
		"Seed",
	);
	process.exitCode = 1;
});
