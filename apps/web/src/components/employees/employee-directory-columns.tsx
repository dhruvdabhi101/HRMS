import { EMPLOYEE_COUNTRIES, type EmployeeListItem } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { formatEmployeeMoney } from "@/utils";

export const employeeDirectoryColumns: ColumnDef<EmployeeListItem, unknown>[] =
	[
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => (
				<Link
					href={`/employees/${row.original.id}`}
					className="font-medium underline-offset-4 hover:underline"
				>
					{row.original.name}
				</Link>
			),
		},
		{
			accessorKey: "countryCode",
			header: "Country",
			cell: ({ row }) =>
				EMPLOYEE_COUNTRIES.find(({ code }) => code === row.original.countryCode)
					?.name,
		},
		{ accessorKey: "department", header: "Department" },
		{ accessorKey: "jobTitle", header: "Job title" },
		{ accessorKey: "level", header: "Level" },
		{
			accessorKey: "annualBaseMinor",
			header: "Annual base · local",
			enableSorting: false,
			cell: ({ row }) =>
				formatEmployeeMoney(
					row.original.annualBaseMinor,
					row.original.currencyCode,
				),
		},
		{
			accessorKey: "bonusTargetBps",
			header: "Bonus target",
			enableSorting: false,
			cell: ({ row }) => `${row.original.bonusTargetBps / 100}%`,
		},
		{
			accessorKey: "status",
			header: "Status",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge
					variant={row.original.status === "active" ? "secondary" : "outline"}
				>
					{row.original.status === "active" ? "Active" : "Terminated"}
				</Badge>
			),
		},
	];
