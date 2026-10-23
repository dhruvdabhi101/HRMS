"use client";

import { EMPLOYEE_COUNTRIES, type EmployeeDetail } from "@repo/shared";
import { FieldLegend, FieldSet } from "@repo/ui/components/field";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import { useEmployeeForm } from "@/hooks/use-employee-form";
import { useEmployeeFilterOptions } from "@/queries";
import { EmployeeCompensationFields } from "./EmployeeCompensationFields";
import { EmployeeProfileFields } from "./EmployeeProfileFields";

export function EmployeeForm({ employee }: { employee?: EmployeeDetail }) {
	const { form, submit, isPending } = useEmployeeForm(employee);
	const options = useEmployeeFilterOptions();
	const countryCode = useWatch({ control: form.control, name: "countryCode" });
	const currency = EMPLOYEE_COUNTRIES.find(
		(country) => country.code === countryCode,
	)?.currency;
	return (
		<form onSubmit={submit} noValidate className="max-w-3xl space-y-8">
			<FieldSet disabled={isPending}>
				<FieldLegend>Employee details</FieldLegend>
				{options.isLoading && (
					<p role="status" className="text-muted-foreground text-sm">
						Loading existing department and job title suggestions…
					</p>
				)}
				{options.isError && (
					<div className="space-y-2">
						<AlertMessage
							variant="destructive"
							message="Suggestions could not be loaded. You can still enter a department and job title."
						/>
						<LoadingButton
							type="button"
							isLoading={options.isFetching}
							variant="outline"
							onClick={() => options.refetch()}
						>
							Retry suggestions
						</LoadingButton>
					</div>
				)}
				<EmployeeProfileFields
					control={form.control}
					suggestions={options.data}
					onCountryChange={() => {
						if (!employee) return;
						form.setValue("annualBase", "", { shouldDirty: true });
						form.setValue("bonusTarget", "", { shouldDirty: true });
					}}
				/>
			</FieldSet>
			<EmployeeCompensationFields
				control={form.control}
				currency={currency}
				currencyChanged={!!employee && countryCode !== employee.countryCode}
				isPending={isPending}
			/>
			{form.formState.errors.root?.server?.message && (
				<div role="alert">
					<AlertMessage
						variant="destructive"
						message={form.formState.errors.root.server.message}
					/>
				</div>
			)}
			<LoadingButton type="submit" isLoading={isPending}>
				{employee ? "Save changes" : "Create employee"}
			</LoadingButton>
			{employee && (
				<Link
					href={`/employees/${employee.id}`}
					className="ml-4 text-sm underline"
				>
					Cancel
				</Link>
			)}
		</form>
	);
}
