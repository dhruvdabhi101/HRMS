import "dotenv/config";

export const config = {
	environment: process.env.NODE_ENV || "development",
	host: process.env.HOST || "0.0.0.0",
	port: Number.parseInt(process.env.PORT || "3001", 10),
	urls: {
		frontend: process.env.FRONTEND_URL || "http://localhost:3000",
		api: process.env.API_URL || "http://localhost:3001",
		cors: process.env.CORS_URLS?.split(",") || ["http://localhost:3000"],
		db: process.env.DATABASE_URL || "file:../../packages/db/prisma/dev.db",
	},
};
