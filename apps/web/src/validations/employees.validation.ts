import {
	decimalToHundredths,
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
	EMPLOYEE_LIMITS,
	isValidHireDate,
} from "@repo/shared";
import { z } from "zod";

function decimalAmount(minimum: number, maximum: number) {
	return z
		.string()
		.trim()
		.superRefine((value, context) => {
			try {
				const amount = decimalToHundredths(value);
				if (amount < minimum || amount > maximum)
					context.addIssue({
						code: "custom",
						message: `Enter a value from ${minimum / 100} to ${maximum / 100}`,
					});
			} catch {
				context.addIssue({
					code: "custom",
					message: "Enter a number with at most two decimal places",
				});
			}
		});
}

export const employeeFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(EMPLOYEE_LIMITS.name),
	countryCode: z.enum(
		EMPLOYEE_COUNTRIES.map((country) => country.code),
		{ error: "Choose a country" },
	),
	department: z
		.string()
		.trim()
		.min(1, "Department is required")
		.max(EMPLOYEE_LIMITS.department),
	jobTitle: z
		.string()
		.trim()
		.min(1, "Job title is required")
		.max(EMPLOYEE_LIMITS.jobTitle),
	level: z.enum(EMPLOYEE_LEVELS, { error: "Choose a level" }),
	gender: z.enum(EMPLOYEE_GENDERS, { error: "Choose a gender option" }),
	hireDate: z
		.string()
		.refine(isValidHireDate, "Enter a valid date no later than today (UTC)"),
	annualBase: decimalAmount(1, EMPLOYEE_LIMITS.annualBaseMinor),
	bonusTarget: decimalAmount(0, EMPLOYEE_LIMITS.bonusTargetBps),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
