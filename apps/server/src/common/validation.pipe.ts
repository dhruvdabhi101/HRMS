import { BadRequestException, ValidationPipe } from "@nestjs/common";

export function createValidationPipe() {
	return new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
		transformOptions: { enableImplicitConversion: false },
		exceptionFactory: (errors) =>
			new BadRequestException({
				message: "Check the highlighted fields.",
				fieldErrors: Object.fromEntries(
					errors.map((error) => [
						error.property,
						Object.values(error.constraints ?? {})[0] ?? "Invalid value",
					]),
				),
			}),
	});
}
