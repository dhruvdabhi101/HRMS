import type {
	GenderPayResponse,
	PayDistributionQuery,
	PayDistributionResponse,
	PayFilters,
	PayGroupsQuery,
	PayGroupsResponse,
} from "@repo/shared";
import { ApiClient } from "@/lib/api-client";

export class InsightsService {
	static groups(query: PayGroupsQuery) {
		return ApiClient.get<PayGroupsResponse>("/api/insights/groups", {
			...query,
			dimensions: query.dimensions.join(","),
		});
	}
	static distribution(query: PayDistributionQuery) {
		return ApiClient.get<PayDistributionResponse>(
			"/api/insights/distribution",
			{ ...query },
		);
	}
	static gender(query: PayFilters) {
		return ApiClient.get<GenderPayResponse>("/api/insights/gender", {
			...query,
		});
	}
}
