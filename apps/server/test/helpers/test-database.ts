import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaService } from "../../src/prisma/prisma.service";

export async function createTestDatabase() {
	const directory = await mkdtemp(join(tmpdir(), "acme-test-"));
	const prisma = new PrismaService(`file:${join(directory, "test.db")}`);
	const close = async () => {
		try {
			await prisma.$disconnect();
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	};
	try {
		const migrationsPath = resolve(
			__dirname,
			"../../../../packages/db/prisma/migrations",
		);
		const entries = await readdir(migrationsPath, { withFileTypes: true });
		for (const name of entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort()) {
			const sql = await readFile(
				join(migrationsPath, name, "migration.sql"),
				"utf8",
			);
			for (const statement of sql.split(";").filter((part) => part.trim())) {
				await prisma.$executeRawUnsafe(statement);
			}
		}
		return { prisma, close };
	} catch (error) {
		await close();
		throw error;
	}
}
