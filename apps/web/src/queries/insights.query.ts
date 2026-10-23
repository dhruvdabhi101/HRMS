import type { PayGroupsQuery } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { InsightsService } from "@/services";

export const INSIGHT_KEYS = {
	all: ["insights"] as const,
	groups: (query: PayGroupsQuery) => ["insights", "groups", query] as const,
};
export function usePayGroups(query: PayGroupsQuery) {
	return useQuery({
		queryKey: INSIGHT_KEYS.groups(query),
		queryFn: () => InsightsService.groups(query),
		refetchOnMount: "always",
	});
}
