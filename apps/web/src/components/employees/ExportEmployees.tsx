"use client";

import { type EmployeeDirectoryQuery, saveFile } from "@repo/shared";
import AlertMessage from "@repo/ui/general/AlertMessage";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { useExportEmployees } from "@/queries";

export function ExportEmployees({
	query,
	disabled,
}: {
	query: EmployeeDirectoryQuery;
	disabled: boolean;
}) {
	const csv = useExportEmployees();
	return (
		<div className="space-y-2">
			<LoadingButton
				variant="outline"
				isLoading={csv.isPending}
				disabled={disabled}
				onClick={() =>
					csv.mutate(query, {
						onSuccess: (content) =>
							saveFile(
								`\uFEFF${content.replace(/^\uFEFF/, "")}`,
								"employees",
								"csv",
							),
					})
				}
			>
				Export CSV
			</LoadingButton>
			{csv.isError && (
				<AlertMessage variant="destructive" message={csv.error.message} />
			)}
		</div>
	);
}
