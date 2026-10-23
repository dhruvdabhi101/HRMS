import { zodResolver } from "@hookform/resolvers/zod";
import type { PayGroupsQuery } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	INSIGHT_KEYS,
	useEmployeeFilterOptions,
	usePayGroups,
} from "@/queries";
import { type PayExplorerValues, payExplorerSchema } from "@/validations";

export function usePayExplorer() {
	const cache = useQueryClient();
	const [query, setQuery] = useState<PayGroupsQuery>({
		dimensions: ["country"],
		metric: "median",
	});
	const form = useForm<PayExplorerValues>({
		resolver: zodResolver(payExplorerSchema),
		defaultValues: {
			firstDimension: "country",
			secondDimension: "",
			metric: "median",
			countryCode: "",
			department: "",
			jobTitle: "",
			level: "",
		},
	});
	const report = usePayGroups(query);
	const options = useEmployeeFilterOptions();
	const submit = form.handleSubmit((values) => {
		const next: PayGroupsQuery = {
			dimensions: values.secondDimension
				? [values.firstDimension, values.secondDimension]
				: [values.firstDimension],
			metric: values.metric,
			countryCode: values.countryCode || undefined,
			department: values.department || undefined,
			jobTitle: values.jobTitle || undefined,
			level: values.level || undefined,
		};
		cache.invalidateQueries({
			queryKey: INSIGHT_KEYS.groups(next),
			exact: true,
		});
		setQuery(next);
		form.reset(values);
	});
	return { form, report, options, submit, query };
}
