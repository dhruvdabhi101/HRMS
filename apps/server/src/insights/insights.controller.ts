import { Controller, Get, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PayGroupsQueryDto } from "./dto/pay-groups-query.dto";
import { PayGroupsResponseDto } from "./dto/pay-groups-response.dto";
import { InsightsService } from "./insights.service";

@ApiTags("Pay insights")
@Controller("insights")
export class InsightsController {
	constructor(private readonly insights: InsightsService) {}

	@Get("groups")
	@ApiResponse({ status: 200, type: PayGroupsResponseDto })
	@ApiResponse({
		status: 400,
		description: "Invalid dimensions, metric or filters",
	})
	@ApiResponse({
		status: 503,
		description: "Invalid FX configuration or unsupported report precision",
	})
	groups(@Query() query: PayGroupsQueryDto): Promise<PayGroupsResponseDto> {
		return this.insights.groups(query);
	}
}
