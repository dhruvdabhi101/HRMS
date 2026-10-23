import { type EmployeeDetail, enumToTitleText } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { ReactNode } from "react";
import { countryName, formatEmployeeDate, formatEmployeeMoney } from "@/utils";

export function EmployeeSummaryView({
	employee,
	payPosition,
}: {
	employee: EmployeeDetail;
	payPosition: ReactNode;
}) {
	const details = [
		["Department", employee.department],
		["Job title", employee.jobTitle],
		["Level", employee.level],
		["Country", countryName(employee.countryCode)],
		["Hire date", formatEmployeeDate(employee.hireDate)],
		["Gender", enumToTitleText(employee.gender)],
	];
	const compensation = [
		["Bonus target", `${employee.bonusTargetBps / 100}%`],
		[
			"Target bonus",
			formatEmployeeMoney(employee.bonusMinor, employee.currencyCode),
		],
		[
			"Annual target compensation",
			formatEmployeeMoney(employee.targetMinor, employee.currencyCode),
		],
	];
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<h1 className="break-words text-3xl font-semibold tracking-tight">
						{employee.name}
					</h1>
					<p className="break-words text-muted-foreground">
						{employee.jobTitle} · {employee.level} · {employee.department}
					</p>
				</div>
				<Badge variant={employee.status === "active" ? "secondary" : "outline"}>
					{enumToTitleText(employee.status)}
				</Badge>
			</header>
			<Card>
				<CardHeader>
					<CardTitle>Annual compensation</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8">
					<div className="space-y-5">
						<div>
							<p className="text-sm text-muted-foreground">Base salary</p>
							<p className="mt-1 break-words text-3xl font-semibold tracking-tight tabular-nums">
								{formatEmployeeMoney(
									employee.annualBaseMinor,
									employee.currencyCode,
								)}
							</p>
						</div>
						<dl className="grid grid-cols-3 gap-4">
							{compensation.map(([label, value]) => (
								<div key={label} className="min-w-0">
									<dt className="text-xs text-muted-foreground">{label}</dt>
									<dd className="mt-1 break-words font-medium tabular-nums">
										{value}
									</dd>
								</div>
							))}
						</dl>
						<p className="text-xs text-muted-foreground">
							Annual target compensation is base salary plus target bonus. Taxes
							and benefits are excluded.
						</p>
					</div>
					<div className="border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
						{payPosition}
					</div>
				</CardContent>
			</Card>
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
		</div>
	);
}
