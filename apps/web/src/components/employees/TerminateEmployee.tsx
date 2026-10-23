"use client";

import type { EmployeeDetail } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { CustomAlertDialog } from "@repo/ui/general/CustomAlertDialog";
import { useState } from "react";
import { useTerminateEmployee } from "@/queries";

export function TerminateEmployee({ employee }: { employee: EmployeeDetail }) {
	const [isOpen, setIsOpen] = useState(false);
	const terminate = useTerminateEmployee();
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
						onSuccess: () => {
							setIsOpen(false);
						},
					})
				}
			/>
		</>
	);
}
