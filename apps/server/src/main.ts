import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { config } from "./common/config";
import { GlobalExceptionFilter } from "./common/filter/global-exception.filter";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bodyParser: false });

	app.enableCors({
		origin: config.urls.cors,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors) => {
				return new BadRequestException({
					message: "Something went wrong",
					data: errors,
				});
			},
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: false,
			},
		}),
	);
	app.useGlobalFilters(new GlobalExceptionFilter());
	app.use(json({ limit: "10mb" }));
	app.use(urlencoded({ extended: true, limit: "10mb" }));
	app.setGlobalPrefix("/api");
	app.useLogger(app.get(Logger));

	const swaggerConfig = new DocumentBuilder()
		.setTitle("Heizen Template API")
		.setDescription("Heizen Template API Documentation")
		.setVersion("1.0")
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig);
	if (config.environment !== "production") {
		SwaggerModule.setup("docs", app, document);
	}

	await app.listen(config.port, config.host);
}
bootstrap();
