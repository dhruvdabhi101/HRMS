import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: "../../apps/server/.env" });

export default defineConfig({
	datasource: {
		url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
	},
});
