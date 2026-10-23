"use client";

import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
	enumToTitleText,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { FieldLegend, FieldSet } from "@repo/ui/components/field";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useWatch } from "react-hook-form";
import { useEmployeeForm } from "@/hooks/use-employee-form";
import { useEmployeeFilterOptions } from "@/queries";
import { EmployeeFormField } from "./EmployeeFormField";

export function EmployeeForm() {
	const { form, submit, isPending } = useEmployeeForm();
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
						<Button
							type="button"
							variant="outline"
							onClick={() => options.refetch()}
						>
							Retry suggestions
						</Button>
					</div>
				)}
				<div className="grid gap-5 sm:grid-cols-2">
					<EmployeeFormField
						control={form.control}
						name="name"
						label="Full name"
					/>
					<EmployeeFormField
						control={form.control}
						name="hireDate"
						label="Hire date"
						type="date"
					/>
					<EmployeeFormField
						control={form.control}
						name="department"
						label="Department"
						suggestions={options.data?.departments}
					/>
					<EmployeeFormField
						control={form.control}
						name="jobTitle"
						label="Job title"
						suggestions={options.data?.jobTitles}
					/>
					<EmployeeFormField
						control={form.control}
						name="countryCode"
						label="Country"
						options={EMPLOYEE_COUNTRIES.map((country) => ({
							value: country.code,
							label: country.name,
						}))}
					/>
					<EmployeeFormField
						control={form.control}
						name="level"
						label="Level"
						options={EMPLOYEE_LEVELS.map((level) => ({
							value: level,
							label: level,
						}))}
					/>
					<EmployeeFormField
						control={form.control}
						name="gender"
						label="Gender"
						options={EMPLOYEE_GENDERS.map((gender) => ({
							value: gender,
							label: enumToTitleText(gender),
						}))}
					/>
				</div>
			</FieldSet>
			<FieldSet disabled={isPending}>
				<FieldLegend>Annual compensation</FieldLegend>
				<div className="grid gap-5 sm:grid-cols-2">
					<EmployeeFormField
						control={form.control}
						name="annualBase"
						label={`Annual base salary (${currency})`}
						inputMode="decimal"
						description="Annual amount in local currency. Up to two decimal places."
					/>
					<EmployeeFormField
						control={form.control}
						name="bonusTarget"
						label="Bonus target (%)"
						inputMode="decimal"
						description="0–100% of annual base salary."
					/>
				</div>
			</FieldSet>
			{form.formState.errors.root?.server?.message && (
				<div role="alert">
					<AlertMessage
						variant="destructive"
						message={form.formState.errors.root.server.message}
					/>
				</div>
			)}
			<LoadingButton type="submit" isLoading={isPending}>
				Create employee
			</LoadingButton>
		</form>
	);
}
