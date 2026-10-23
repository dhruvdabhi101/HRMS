import { FieldLegend, FieldSet } from "@repo/ui/components/field";
import type { Control } from "react-hook-form";
import type { EmployeeFormValues } from "@/validations";
import { EmployeeFormField } from "./EmployeeFormField";

export function EmployeeCompensationFields({
	control,
	currency,
	currencyChanged,
	isPending,
}: {
	control: Control<EmployeeFormValues>;
	currency?: string;
	currencyChanged: boolean;
	isPending: boolean;
}) {
	return (
		<FieldSet disabled={isPending}>
			<FieldLegend>Annual compensation</FieldLegend>
			{currencyChanged && (
				<p className="text-muted-foreground text-sm">
					Enter both amounts for the new currency. Existing pay is not
					converted.
				</p>
			)}
			<div className="grid gap-5 sm:grid-cols-2">
				<EmployeeFormField
					control={control}
					name="annualBase"
					label={`Annual base salary (${currency})`}
					inputMode="decimal"
					description="Annual amount in local currency. Up to two decimal places."
				/>
				<EmployeeFormField
					control={control}
					name="bonusTarget"
					label="Bonus target (%)"
					inputMode="decimal"
					description="0–100% of annual base salary."
				/>
			</div>
		</FieldSet>
	);
}
