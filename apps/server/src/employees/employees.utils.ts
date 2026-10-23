import { CompensationChange, Employee } from "@repo/db";
import { EmployeeDetail } from "@repo/shared";
import { calculateCompensation } from "../compensation/compensation.utils";

export function toEmployeeDetail(
	employee: Employee & { compensationChanges: CompensationChange[] },
): EmployeeDetail {
	const { hireDate, createdAt, updatedAt, compensationChanges, ...profile } =
		employee;
	const { bonusMinor, targetMinor } = calculateCompensation(
		employee.annualBaseMinor,
		employee.bonusTargetBps,
		1_000_000,
	);
	return {
		...profile,
		level: employee.level as EmployeeDetail["level"],
		countryCode: employee.countryCode as EmployeeDetail["countryCode"],
		hireDate: hireDate.toISOString().slice(0, 10),
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		bonusMinor,
		targetMinor,
		compensationChanges: compensationChanges.map(
			({
				id,
				oldBaseMinor,
				newBaseMinor,
				oldBonusBps,
				newBonusBps,
				oldCurrencyCode,
				newCurrencyCode,
				changedAt,
			}) => ({
				id,
				oldBaseMinor,
				newBaseMinor,
				oldBonusBps,
				newBonusBps,
				oldCurrencyCode,
				newCurrencyCode,
				changedAt: changedAt.toISOString(),
			}),
		),
	};
}
