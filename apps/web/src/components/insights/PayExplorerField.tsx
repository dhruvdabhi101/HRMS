import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@repo/ui/components/native-select";
import RequiredStar from "@repo/ui/general/RequiredStar";
import {
	type Control,
	Controller,
	type FieldValues,
	type Path,
} from "react-hook-form";

export function PayExplorerField<Values extends FieldValues>({
	control,
	name,
	label,
	options,
	required = false,
	disabled = false,
}: {
	control: Control<Values>;
	name: Path<Values>;
	label: string;
	options: { value: string; label: string }[];
	required?: boolean;
	disabled?: boolean;
}) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={`pay-${name}`}>
						{label} {required && <RequiredStar />}
					</FieldLabel>
					<NativeSelect
						{...field}
						id={`pay-${name}`}
						className="w-full"
						aria-invalid={fieldState.invalid}
						disabled={disabled}
					>
						{options.map((option) => (
							<NativeSelectOption key={option.value} value={option.value}>
								{option.label}
							</NativeSelectOption>
						))}
					</NativeSelect>
					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	);
}
