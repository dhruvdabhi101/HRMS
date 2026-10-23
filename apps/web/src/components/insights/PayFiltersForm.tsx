import { zodResolver } from "@hookform/resolvers/zod";
import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	type PayFilters,
} from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useForm } from "react-hook-form";
import { useEmployeeFilterOptions } from "@/queries";
import { type PayFilterValues, payFiltersSchema } from "@/validations";
import { PayExplorerField } from "./PayExplorerField";

export function PayFiltersForm({
	initialCountry,
	isLoading,
	onApply,
}: {
	initialCountry?: PayFilters["countryCode"];
	isLoading: boolean;
	onApply: (filters: PayFilters) => void;
}) {
	const options = useEmployeeFilterOptions();
	const form = useForm<PayFilterValues>({
		resolver: zodResolver(payFiltersSchema),
		defaultValues: {
			countryCode: initialCountry ?? "",
			department: "",
			jobTitle: "",
			level: "",
		},
	});
	const allOptions = (values: readonly string[]) => [
		{ value: "", label: "All" },
		...values.map((value) => ({ value, label: value })),
	];
	const fields = [
		{
			name: "countryCode" as const,
			label: "Country",
			options: [
				{ value: "", label: "All" },
				...EMPLOYEE_COUNTRIES.map((country) => ({
					value: country.code,
					label: country.name,
				})),
			],
		},
		{
			name: "department" as const,
			label: "Department",
			options: allOptions(options.data?.departments ?? []),
		},
		{
			name: "jobTitle" as const,
			label: "Job title",
			options: allOptions(options.data?.jobTitles ?? []),
		},
		{
			name: "level" as const,
			label: "Level",
			options: allOptions(EMPLOYEE_LEVELS),
		},
	];
	const submit = form.handleSubmit((values) => {
		onApply({
			countryCode: values.countryCode || undefined,
			department: values.department || undefined,
			jobTitle: values.jobTitle || undefined,
			level: values.level || undefined,
		});
		form.reset(values);
	});
	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{fields.map((field) => {
					const needsOptions =
						field.name === "department" || field.name === "jobTitle";
					return needsOptions && options.isPending ? (
						<div key={field.name} className="space-y-2">
							<p className="text-sm">{field.label}</p>
							<Skeleton className="h-8" />
						</div>
					) : (
						<PayExplorerField
							key={field.name}
							{...field}
							control={form.control}
							disabled={needsOptions && options.isError}
						/>
					);
				})}
			</div>
			{options.isError && (
				<div className="space-y-2">
					<AlertMessage
						variant="destructive"
						message="Department and job title filters could not be loaded."
					/>
					<LoadingButton
						type="button"
						variant="outline"
						isLoading={options.isFetching}
						onClick={() => options.refetch()}
					>
						Retry filters
					</LoadingButton>
				</div>
			)}
			<div className="flex flex-wrap items-center gap-3">
				<LoadingButton type="submit" isLoading={isLoading}>
					Update comparison
				</LoadingButton>
				{form.formState.isDirty && (
					<p role="status" className="text-sm text-muted-foreground">
						Apply changes to update the comparison.
					</p>
				)}
			</div>
		</form>
	);
}
