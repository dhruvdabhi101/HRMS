"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { decimalToHundredths } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api-error";
import { EMPLOYEE_KEYS, useCreateEmployee } from "@/queries";
import { type EmployeeFormValues, employeeFormSchema } from "@/validations";

export function useEmployeeForm() {
	const router = useRouter();
	const cache = useQueryClient();
	const create = useCreateEmployee();
	const form = useForm<EmployeeFormValues>({
		resolver: zodResolver(employeeFormSchema),
		defaultValues: {
			name: "",
			countryCode: "IN",
			department: "",
			jobTitle: "",
			level: "L1",
			hireDate: "",
			annualBase: "",
			bonusTarget: "0",
		},
	});
	const submit = form.handleSubmit((values) => {
		form.clearErrors();
		const { annualBase, bonusTarget, ...profile } = values;
		create.mutate(
			{
				...profile,
				annualBaseMinor: decimalToHundredths(annualBase),
				bonusTargetBps: decimalToHundredths(bonusTarget),
			},
			{
				onSuccess: (employee) => {
					cache.setQueryData(EMPLOYEE_KEYS.detail(employee.id), employee);
					cache.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
					router.push(`/employees/${employee.id}`);
				},
				onError: (error) => {
					if (
						!(error instanceof ApiError) ||
						!Object.keys(error.fieldErrors).length
					) {
						form.setError("root.server", { message: error.message });
						return;
					}
					for (const [field, message] of Object.entries(error.fieldErrors)) {
						const name =
							field === "annualBaseMinor"
								? "annualBase"
								: field === "bonusTargetBps"
									? "bonusTarget"
									: field;
						form.setError(
							name in values
								? (name as keyof EmployeeFormValues)
								: "root.server",
							{ message },
						);
					}
				},
			},
		);
	});
	return { form, submit, isPending: create.isPending };
}
