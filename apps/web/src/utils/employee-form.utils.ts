import type { CreateEmployeeInput, UpdateEmployeeInput } from "@repo/shared";
import type { EmployeeFormValues } from "@/validations";

export function employeeFormField(field: string) {
	return field === "annualBaseMinor"
		? "annualBase"
		: field === "bonusTargetBps"
			? "bonusTarget"
			: field;
}

export function changedEmployeeFields(
	input: CreateEmployeeInput,
	dirtyFields: Partial<Record<keyof EmployeeFormValues, boolean>>,
): UpdateEmployeeInput {
	return Object.fromEntries(
		Object.entries(input).filter(
			([field]) =>
				dirtyFields[employeeFormField(field) as keyof EmployeeFormValues] ||
				(dirtyFields.countryCode &&
					(field === "annualBaseMinor" || field === "bonusTargetBps")),
		),
	);
}
