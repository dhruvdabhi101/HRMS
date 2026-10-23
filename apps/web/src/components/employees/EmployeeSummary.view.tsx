import {
	EMPLOYEE_COUNTRIES,
	type EmployeeDetail,
	enumToTitleText,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { formatEmployeeDate, formatEmployeeMoney } from "@/utils";

export function EmployeeSummaryView({
	employee,
}: {
	employee: EmployeeDetail;
}) {
	const details = [
		["Department", employee.department],
		["Job title", employee.jobTitle],
		["Level", employee.level],
		[
			"Country",
			EMPLOYEE_COUNTRIES.find(
				(country) => country.code === employee.countryCode,
			)?.name ?? employee.countryCode,
		],
		["Hire date", formatEmployeeDate(employee.hireDate)],
		["Gender", enumToTitleText(employee.gender)],
	];
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<h1 className="break-words text-2xl font-semibold">
						{employee.name}
					</h1>
					<p className="break-words text-muted-foreground">
						{employee.jobTitle} · {employee.department}
					</p>
				</div>
				<Badge variant="secondary">{enumToTitleText(employee.status)}</Badge>
			</header>
			<Card>
				<CardHeader>
					<CardTitle>Employee details</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{details.map(([label, value]) => (
							<div key={label} className="min-w-0">
								<dt className="text-sm text-muted-foreground">{label}</dt>
								<dd className="mt-1 break-words font-medium">{value}</dd>
							</div>
						))}
					</dl>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Annual compensation</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-5 sm:grid-cols-2">
						{[
							[
								"Base salary",
								formatEmployeeMoney(
									employee.annualBaseMinor,
									employee.currencyCode,
								),
							],
							["Bonus target", `${employee.bonusTargetBps / 100}%`],
							[
								"Target bonus",
								formatEmployeeMoney(employee.bonusMinor, employee.currencyCode),
							],
							[
								"Annual target compensation",
								formatEmployeeMoney(
									employee.targetMinor,
									employee.currencyCode,
								),
							],
						].map(([label, value]) => (
							<div key={label}>
								<dt className="text-sm text-muted-foreground">{label}</dt>
								<dd className="mt-1 break-words text-lg font-medium tabular-nums">
									{value}
								</dd>
							</div>
						))}
					</dl>
					<p className="mt-5 text-sm text-muted-foreground">
						Annual target compensation includes base salary and target bonus.
						Taxes and benefits are excluded.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
