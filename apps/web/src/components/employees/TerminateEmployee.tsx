"use client";

import type { EmployeeDetail } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { CustomAlertDialog } from "@repo/ui/general/CustomAlertDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EMPLOYEE_KEYS, useTerminateEmployee } from "@/queries";

export function TerminateEmployee({ employee }: { employee: EmployeeDetail }) {
	const [isOpen, setIsOpen] = useState(false);
	const terminate = useTerminateEmployee();
	const cache = useQueryClient();
	return (
		<>
			<Button
				variant="destructive"
				onClick={() => {
					terminate.reset();
					setIsOpen(true);
				}}
			>
				Terminate employee
			</Button>
			<CustomAlertDialog
				isOpen={isOpen}
				onClose={() => {
					if (!terminate.isPending) setIsOpen(false);
				}}
				title={`Terminate ${employee.name}?`}
				description="The employee and compensation history remain available. Terminated employees cannot be edited or reactivated."
				confirmText="Terminate employee"
				cancelText="Cancel"
				isLoading={terminate.isPending}
				error={terminate.error?.message}
				onConfirm={() =>
					terminate.mutate(employee.id, {
						onSuccess: (updated) => {
							cache.setQueryData(EMPLOYEE_KEYS.detail(employee.id), updated);
							cache.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
							setIsOpen(false);
						},
					})
				}
			/>
		</>
	);
}
