import { NotFoundException } from "@nestjs/common";
import { CompensationChange, Employee, Prisma } from "@repo/db";
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

export async function findEmployee(
	prisma: Prisma.TransactionClient,
	id: string,
) {
	const employee = await prisma.employee.findUnique({
		where: { id },
		include: employeeDetailInclude,
	});
	if (!employee) throw new NotFoundException("Employee not found");
	return employee;
}

export const employeeDetailInclude = {
	compensationChanges: {
		orderBy: [{ changedAt: "desc" }, { id: "desc" }],
	},
} satisfies Prisma.EmployeeInclude;
