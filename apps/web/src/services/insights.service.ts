import type { PayGroupsQuery, PayGroupsResponse } from "@repo/shared";
import { ApiClient } from "@/lib/api-client";

export class InsightsService {
	static groups(query: PayGroupsQuery) {
		return ApiClient.get<PayGroupsResponse>("/api/insights/groups", {
			...query,
			dimensions: query.dimensions.join(","),
		});
	}
}
