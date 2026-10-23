import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { GlobalExceptionFilter } from "../../src/common/filter/global-exception.filter";
import { createValidationPipe } from "../../src/common/validation.pipe";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestDatabase } from "./test-database";

export const insightEmployee = {
	name: "Synthetic employee",
	countryCode: "US",
	currencyCode: "USD",
	department: "Engineering",
	jobTitle: "Engineer",
	level: "L3",
	gender: "woman" as const,
	hireDate: new Date("2024-02-29"),
	annualBaseMinor: 1_000,
	bonusTargetBps: 0,
};
export async function createInsightsApp() {
	const database = await createTestDatabase();
	await database.prisma.fxRate.createMany({
		data: [
			{ currencyCode: "USD", usdRateMicros: 1_000_000 },
			{ currencyCode: "INR", usdRateMicros: 12_000 },
			{ currencyCode: "GBP", usdRateMicros: 1_250_000 },
			{ currencyCode: "EUR", usdRateMicros: 1_100_000 },
			{ currencyCode: "CAD", usdRateMicros: 740_000 },
		].map((rate) => ({ ...rate, asOfDate: new Date("2026-01-01") })),
	});
	const module = await Test.createTestingModule({ imports: [AppModule] })
		.overrideProvider(PrismaService)
		.useValue(database.prisma)
		.compile();
	const app = module.createNestApplication({ logger: false });
	app.setGlobalPrefix("api");
	app.useGlobalPipes(createValidationPipe());
	app.useGlobalFilters(new GlobalExceptionFilter());
	await app.listen(0, "127.0.0.1");
	return {
		app,
		prisma: database.prisma,
		close: async () => {
			await app.close();
			await database.close();
		},
	};
}
