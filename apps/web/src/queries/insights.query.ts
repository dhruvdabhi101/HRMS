import type {
	PayDistributionQuery,
	PayFilters,
	PayGroupsQuery,
} from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { InsightsService } from "@/services";

export const INSIGHT_KEYS = {
	all: ["insights"] as const,
	distribution: (query: PayDistributionQuery) =>
		["insights", "distribution", query] as const,
	gender: (query: PayFilters) => ["insights", "gender", query] as const,
	groups: (query: PayGroupsQuery) => ["insights", "groups", query] as const,
};
export function usePayGroups(query: PayGroupsQuery) {
	return useQuery({
		queryKey: INSIGHT_KEYS.groups(query),
		queryFn: () => InsightsService.groups(query),
		refetchOnMount: "always",
	});
}

export function usePayDistribution(query: PayDistributionQuery) {
	return useQuery({
		queryKey: INSIGHT_KEYS.distribution(query),
		queryFn: () => InsightsService.distribution(query),
		refetchOnMount: "always",
	});
}
export function useGenderPay(query: PayFilters) {
	return useQuery({
		queryKey: INSIGHT_KEYS.gender(query),
		queryFn: () => InsightsService.gender(query),
		refetchOnMount: "always",
	});
}
