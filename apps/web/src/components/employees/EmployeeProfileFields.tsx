import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
	type EmployeeFilterOptions,
	enumToTitleText,
} from "@repo/shared";
import type { Control } from "react-hook-form";
import type { EmployeeFormValues } from "@/validations";
import { EmployeeFormField } from "./EmployeeFormField";

export function EmployeeProfileFields({
	control,
	suggestions,
	onCountryChange,
}: {
	control: Control<EmployeeFormValues>;
	suggestions?: EmployeeFilterOptions;
	onCountryChange: () => void;
}) {
	return (
		<div className="grid gap-5 sm:grid-cols-2">
			<EmployeeFormField control={control} name="name" label="Full name" />
			<EmployeeFormField
				control={control}
				name="hireDate"
				label="Hire date"
				type="date"
			/>
			<EmployeeFormField
				control={control}
				name="department"
				label="Department"
				suggestions={suggestions?.departments}
			/>
			<EmployeeFormField
				control={control}
				name="jobTitle"
				label="Job title"
				suggestions={suggestions?.jobTitles}
			/>
			<EmployeeFormField
				control={control}
				name="countryCode"
				label="Country"
				onValueChange={onCountryChange}
				options={EMPLOYEE_COUNTRIES.map((country) => ({
					value: country.code,
					label: country.name,
				}))}
			/>
			<EmployeeFormField
				control={control}
				name="level"
				label="Level"
				options={EMPLOYEE_LEVELS.map((level) => ({
					value: level,
					label: level,
				}))}
			/>
			<EmployeeFormField
				control={control}
				name="gender"
				label="Gender"
				options={EMPLOYEE_GENDERS.map((gender) => ({
					value: gender,
					label: enumToTitleText(gender),
				}))}
			/>
		</div>
	);
}
