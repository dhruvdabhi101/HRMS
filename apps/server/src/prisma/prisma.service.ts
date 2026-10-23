import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@repo/db";
import { config } from "src/common/config";

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		const adapter = new PrismaBetterSqlite3({ url: config.urls.db });

		super({
			adapter,
			log: ["error", "warn", "info"],
			errorFormat: "pretty",
		});
	}

	async onModuleInit() {
		try {
			await this.$connect();
		} catch (error) {
			console.error("Failed to connect to database:", error);
			throw error;
		}
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}
}
