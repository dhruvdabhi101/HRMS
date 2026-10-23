import { BadRequestException } from "@nestjs/common";
import { Employee } from "@repo/db";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

export function employeeUpdateData(
	employee: Employee,
	input: UpdateEmployeeDto,
	currencyCode: string,
) {
	if (currencyCode !== employee.currencyCode) {
		const fieldErrors = Object.fromEntries(
			(["annualBaseMinor", "bonusTargetBps"] as const)
				.filter((field) => input[field] === undefined)
				.map((field) => [
					field,
					"Enter new compensation for the selected currency",
				]),
		);
		if (Object.keys(fieldErrors).length) {
			throw new BadRequestException({
				message: "Check the highlighted fields.",
				fieldErrors,
			});
		}
	}
	const data = {
		...input,
		currencyCode,
		hireDate:
			input.hireDate === undefined
				? employee.hireDate
				: new Date(`${input.hireDate}T00:00:00.000Z`),
	};
	const changed = Object.entries(data).some(([field, value]) => {
		if (value === undefined) return false;
		const previous = employee[field as keyof Employee];
		return value instanceof Date && previous instanceof Date
			? value.getTime() !== previous.getTime()
			: value !== previous;
	});
	if (!changed) throw new BadRequestException("No changes to save");
	return data;
}

export function compensationUpdate(
	employee: Employee,
	input: UpdateEmployeeDto,
	currencyCode: string,
) {
	const annualBaseMinor = input.annualBaseMinor ?? employee.annualBaseMinor;
	const bonusTargetBps = input.bonusTargetBps ?? employee.bonusTargetBps;
	if (
		annualBaseMinor === employee.annualBaseMinor &&
		bonusTargetBps === employee.bonusTargetBps &&
		currencyCode === employee.currencyCode
	)
		return undefined;
	return {
		create: {
			oldBaseMinor: employee.annualBaseMinor,
			newBaseMinor: annualBaseMinor,
			oldBonusBps: employee.bonusTargetBps,
			newBonusBps: bonusTargetBps,
			oldCurrencyCode: employee.currencyCode,
			newCurrencyCode: currencyCode,
		},
	};
}
