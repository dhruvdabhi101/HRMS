import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	type EmployeeDirectoryQuery,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@repo/ui/components/native-select";
import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useEmployeeFilterOptions } from "@/queries";

interface Props {
	query: EmployeeDirectoryQuery;
	search: string;
	onSearch: (search: string) => void;
	onFilter: (filter: Partial<EmployeeDirectoryQuery>) => void;
	onClear: () => void;
}

export function EmployeeDirectoryFilters({
	query,
	search,
	onSearch,
	onFilter,
	onClear,
}: Props) {
	const options = useEmployeeFilterOptions();
	const filters = [
		{
			key: "countryCode" as const,
			label: "Country",
			values: EMPLOYEE_COUNTRIES.map(({ code, name }) => ({
				value: code,
				label: name,
			})),
		},
		{
			key: "department" as const,
			label: "Department",
			values: (options.data?.departments ?? []).map((value) => ({
				value,
				label: value,
			})),
		},
		{
			key: "jobTitle" as const,
			label: "Job title",
			values: (options.data?.jobTitles ?? []).map((value) => ({
				value,
				label: value,
			})),
		},
		{
			key: "level" as const,
			label: "Level",
			values: EMPLOYEE_LEVELS.map((value) => ({ value, label: value })),
		},
		{
			key: "status" as const,
			label: "Status",
			values: [
				{ value: "active", label: "Active" },
				{ value: "terminated", label: "Terminated" },
				{ value: "all", label: "All" },
			],
		},
	];
	return (
		<div className="space-y-4">
			<div className="max-w-md space-y-2">
				<Label htmlFor="employee-search">Search by name</Label>
				<Input
					id="employee-search"
					type="search"
					maxLength={120}
					value={search}
					onChange={(event) => onSearch(event.target.value)}
					placeholder="Search employees…"
				/>
			</div>
			<div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{filters.map(({ key, label, values }) => (
					<div key={key} className="min-w-0 space-y-2">
						<Label htmlFor={`filter-${key}`}>{label}</Label>
						{options.isLoading &&
						(key === "department" || key === "jobTitle") ? (
							<Skeleton className="h-8 w-full" />
						) : (
							<NativeSelect
								className="w-full"
								id={`filter-${key}`}
								value={query[key] ?? ""}
								disabled={
									options.isError &&
									(key === "department" || key === "jobTitle")
								}
								onChange={(event) =>
									onFilter({ [key]: event.target.value || undefined })
								}
							>
								{key !== "status" && (
									<NativeSelectOption value="">All</NativeSelectOption>
								)}
								{values.map(({ value, label: optionLabel }) => (
									<NativeSelectOption key={value} value={value}>
										{optionLabel}
									</NativeSelectOption>
								))}
							</NativeSelect>
						)}
					</div>
				))}
				<Button variant="outline" onClick={onClear}>
					Clear filters
				</Button>
			</div>
			{options.isError && (
				<div role="alert" className="space-y-2">
					<AlertMessage
						variant="destructive"
						message="Department and job title filters could not be loaded."
					/>
					<LoadingButton
						variant="outline"
						isLoading={options.isFetching}
						onClick={() => options.refetch()}
					>
						Retry filters
					</LoadingButton>
				</div>
			)}
		</div>
	);
}
