import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	PAY_DIMENSIONS,
	PAY_METRICS,
} from "@repo/shared";
import { z } from "zod";

export const payExplorerSchema = z
	.object({
		firstDimension: z.enum(PAY_DIMENSIONS),
		secondDimension: z.union([z.literal(""), z.enum(PAY_DIMENSIONS)]),
		metric: z.enum(PAY_METRICS),
		countryCode: z.union([
			z.literal(""),
			z.enum(EMPLOYEE_COUNTRIES.map((country) => country.code)),
		]),
		department: z.string().trim().max(100),
		jobTitle: z.string().trim().max(100),
		level: z.union([z.literal(""), z.enum(EMPLOYEE_LEVELS)]),
	})
	.refine((values) => values.firstDimension !== values.secondDimension, {
		message: "Choose a different second dimension.",
		path: ["secondDimension"],
	});
export type PayExplorerValues = z.infer<typeof payExplorerSchema>;
