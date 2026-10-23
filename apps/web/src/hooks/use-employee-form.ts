"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { decimalToHundredths, type EmployeeDetail } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api-error";
import { EMPLOYEE_KEYS, useCreateEmployee, useUpdateEmployee } from "@/queries";
import { type EmployeeFormValues, employeeFormSchema } from "@/validations";

export function useEmployeeForm(employee?: EmployeeDetail) {
	const router = useRouter();
	const cache = useQueryClient();
	const create = useCreateEmployee();
	const update = useUpdateEmployee();
	const form = useForm<EmployeeFormValues>({
		resolver: zodResolver(employeeFormSchema),
		defaultValues: employee
			? {
					name: employee.name,
					countryCode: employee.countryCode,
					department: employee.department,
					jobTitle: employee.jobTitle,
					level: employee.level,
					gender: employee.gender,
					hireDate: employee.hireDate,
					annualBase: (employee.annualBaseMinor / 100).toFixed(2),
					bonusTarget: (employee.bonusTargetBps / 100).toFixed(2),
				}
			: {
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
		const input = {
			...profile,
			annualBaseMinor: decimalToHundredths(annualBase),
			bonusTargetBps: decimalToHundredths(bonusTarget),
		};
		const callbacks = {
			onSuccess: (employee: EmployeeDetail) => {
				cache.setQueryData(EMPLOYEE_KEYS.detail(employee.id), employee);
				cache.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
				router.push(`/employees/${employee.id}`);
			},
			onError: (error: Error) => {
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
						name in values ? (name as keyof EmployeeFormValues) : "root.server",
						{ message },
					);
				}
			},
		};
		if (employee) update.mutate({ id: employee.id, input }, callbacks);
		else create.mutate(input, callbacks);
	});
	return { form, submit, isPending: create.isPending || update.isPending };
}
