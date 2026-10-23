import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	PAY_DIMENSION_LABELS,
	PAY_DIMENSIONS,
	PAY_METRIC_LABELS,
	PAY_METRICS,
} from "@repo/shared";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import type { usePayExplorer } from "@/hooks/use-pay-explorer";
import { PayExplorerField } from "./PayExplorerField";

export function PayExplorerControls({
	explorer,
}: {
	explorer: ReturnType<typeof usePayExplorer>;
}) {
	const { form, options, submit, report } = explorer;
	const dimensions = PAY_DIMENSIONS.map((value) => ({
		value,
		label: PAY_DIMENSION_LABELS[value],
	}));
	const values = (items: readonly string[]) => [
		{ value: "", label: "All" },
		...items.map((value) => ({ value, label: value })),
	];
	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<PayExplorerField
					control={form.control}
					name="firstDimension"
					label="Group by"
					options={dimensions}
					required
				/>
				<PayExplorerField
					control={form.control}
					name="secondDimension"
					label="Then by"
					options={[{ value: "", label: "None" }, ...dimensions]}
				/>
				<PayExplorerField
					control={form.control}
					name="metric"
					label="Metric"
					options={PAY_METRICS.map((value) => ({
						value,
						label: PAY_METRIC_LABELS[value],
					}))}
					required
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<PayExplorerField
					control={form.control}
					name="countryCode"
					label="Country"
					options={[
						{ value: "", label: "All" },
						...EMPLOYEE_COUNTRIES.map((country) => ({
							value: country.code,
							label: country.name,
						})),
					]}
				/>
				{options.isPending ? (
					<div className="space-y-2">
						<p className="text-sm">Department</p>
						<Skeleton className="h-8" />
					</div>
				) : (
					<PayExplorerField
						control={form.control}
						name="department"
						label="Department"
						options={values(options.data?.departments ?? [])}
						disabled={options.isError}
					/>
				)}
				{options.isPending ? (
					<div className="space-y-2">
						<p className="text-sm">Job title</p>
						<Skeleton className="h-8" />
					</div>
				) : (
					<PayExplorerField
						control={form.control}
						name="jobTitle"
						label="Job title"
						options={values(options.data?.jobTitles ?? [])}
						disabled={options.isError}
					/>
				)}
				<PayExplorerField
					control={form.control}
					name="level"
					label="Level"
					options={values(EMPLOYEE_LEVELS)}
				/>
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
				<LoadingButton
					type="submit"
					isLoading={report.isPending || report.isFetching}
				>
					Update report
				</LoadingButton>
				{form.formState.isDirty && (
					<p className="text-sm text-muted-foreground" role="status">
						Apply changes to update the results.
					</p>
				)}
			</div>
		</form>
	);
}
