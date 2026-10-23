import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@repo/ui/components/native-select";
import RequiredStar from "@repo/ui/general/RequiredStar";
import { type Control, Controller } from "react-hook-form";
import type { EmployeeFormValues } from "@/validations";

interface EmployeeFormFieldProps {
	control: Control<EmployeeFormValues>;
	name: keyof EmployeeFormValues;
	label: string;
	options?: readonly { value: string; label: string }[];
	type?: "text" | "date";
	inputMode?: "decimal";
	description?: string;
	suggestions?: string[];
}

export function EmployeeFormField({
	control,
	name,
	label,
	options,
	type = "text",
	inputMode,
	description,
	suggestions,
}: EmployeeFormFieldProps) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={name}>
						{label} <RequiredStar />
					</FieldLabel>
					{options ? (
						<NativeSelect
							{...field}
							value={field.value ?? ""}
							id={name}
							aria-invalid={fieldState.invalid}
							className="w-full"
						>
							<NativeSelectOption value="" disabled>
								Select an option
							</NativeSelectOption>
							{options.map((option) => (
								<NativeSelectOption key={option.value} value={option.value}>
									{option.label}
								</NativeSelectOption>
							))}
						</NativeSelect>
					) : (
						<Input
							{...field}
							value={field.value ?? ""}
							id={name}
							type={type}
							list={suggestions ? `${name}-suggestions` : undefined}
							inputMode={inputMode}
							aria-invalid={fieldState.invalid}
						/>
					)}
					{suggestions && (
						<datalist id={`${name}-suggestions`}>
							{suggestions.map((value) => (
								<option key={value} value={value} />
							))}
						</datalist>
					)}
					{description && <FieldDescription>{description}</FieldDescription>}
					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	);
}
