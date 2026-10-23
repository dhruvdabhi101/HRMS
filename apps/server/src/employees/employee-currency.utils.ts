import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@repo/db";
import { EMPLOYEE_COUNTRIES } from "@repo/shared";

export async function getEmployeeCurrency(
	prisma: Prisma.TransactionClient,
	input: { countryCode: string; currencyCode?: string },
) {
	const country = EMPLOYEE_COUNTRIES.find(
		({ code }) => code === input.countryCode,
	);
	if (
		!country ||
		(input.currencyCode !== undefined &&
			input.currencyCode !== country.currency)
	) {
		throw new BadRequestException({
			message: "Check the highlighted fields.",
			fieldErrors: {
				currencyCode: "Currency must match the selected country",
			},
		});
	}
	const currency = await prisma.fxRate.findUnique({
		where: { currencyCode: country.currency },
	});
	if (!currency) {
		throw new BadRequestException({
			message: "Check the highlighted fields.",
			fieldErrors: {
				countryCode: "This country's currency is not configured yet.",
			},
		});
	}
	return country.currency;
}
