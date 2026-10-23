import { Module, RequestMethod } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { seconds, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
	imports: [
		LoggerModule.forRoot({
			forRoutes: [{ method: RequestMethod.ALL, path: "*splat" }],
			pinoHttp: {
				transport: {
					targets: [
						{
							target: "pino-pretty",
							options: {
								colorize: true,
								singleLine: false,
								translateTime: "yyyy-mm-dd HH:MM:ss.l",
								hideObject: true,
								ignore: "pid,hostname",
								messageFormat:
									"[{req.id}] {req.method} {req.url} - {msg}  {res.statusCode} {responseTime}",
							},
						},
					],
				},
				redact: ["req.headers", "res.headers"],
				level: "debug",
				autoLogging: {
					ignore: (req) => req.url?.startsWith("/api/health") ?? false,
				},
			},
		}),
		ThrottlerModule.forRoot({
			throttlers: [
				{
					name: "default",
					ttl: seconds(60),
					limit: 300,
				},
			],
		}),
		PrismaModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
