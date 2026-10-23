import { calculateCompensation } from "../compensation/compensation.utils";
import { EmployeeExportRow } from "./employee-export.types";

function csvCell(value: string) {
	const literal = /^[\s\p{Cc}]*[=+\-@＝＋－＠\t\r\n]/u.test(value)
		? `'${value}`
		: value;
	return `"${literal.replaceAll('"', '""')}"`;
}

function employeeRow(employee: EmployeeExportRow) {
	const { bonusMinor, targetMinor } = calculateCompensation(
		employee.annualBaseMinor,
		employee.bonusTargetBps,
		1_000_000,
	);
	return [
		employee.id,
		employee.name,
		employee.countryCode,
		employee.department,
		employee.jobTitle,
		employee.level,
		employee.gender,
		employee.hireDate.toISOString().slice(0, 10),
		employee.status,
		employee.currencyCode,
		(employee.annualBaseMinor / 100).toFixed(2),
		(employee.bonusTargetBps / 100).toFixed(2),
		(bonusMinor / 100).toFixed(2),
		(targetMinor / 100).toFixed(2),
	];
}

export function employeesToCsv(employees: EmployeeExportRow[]) {
	const header = [
		"Employee ID",
		"Name",
		"Country code",
		"Department",
		"Job title",
		"Level",
		"Gender",
		"Hire date",
		"Status",
		"Currency",
		"Annual base salary (local)",
		"Bonus target (%)",
		"Target bonus (local)",
		"Annual target compensation (local)",
	];
	return `\uFEFF${[header, ...employees.map(employeeRow)].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
