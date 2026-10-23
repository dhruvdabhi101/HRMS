import { Controller, Get, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PayDistributionQueryDto } from "./dto/pay-distribution-query.dto";
import { PayFiltersQueryDto } from "./dto/pay-filters-query.dto";
import { PayGroupsQueryDto } from "./dto/pay-groups-query.dto";
import { PayGroupsResponseDto } from "./dto/pay-groups-response.dto";
import {
	GenderPayResponseDto,
	PayDistributionResponseDto,
} from "./dto/pay-statistics-response.dto";
import { GenderPayService } from "./gender-pay.service";
import { InsightsService } from "./insights.service";
import { PayDistributionService } from "./pay-distribution.service";

@ApiTags("Pay insights")
@Controller("insights")
export class InsightsController {
	constructor(
		private readonly insights: InsightsService,
		private readonly distributions: PayDistributionService,
		private readonly genders: GenderPayService,
	) {}

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
	@Get("distribution")
	@ApiResponse({ status: 200, type: PayDistributionResponseDto })
	@ApiResponse({
		status: 400,
		description: "Invalid filters, pagination or employee ID",
	})
	@ApiResponse({ status: 404, description: "Comparison employee not found" })
	@ApiResponse({ status: 503, description: "Invalid FX configuration" })
	distribution(
		@Query() query: PayDistributionQueryDto,
	): Promise<PayDistributionResponseDto> {
		return this.distributions.distribution(query);
	}

	@Get("gender")
	@ApiResponse({ status: 200, type: GenderPayResponseDto })
	@ApiResponse({ status: 400, description: "Invalid comparison filters" })
	@ApiResponse({ status: 503, description: "Invalid FX configuration" })
	gender(@Query() query: PayFiltersQueryDto): Promise<GenderPayResponseDto> {
		return this.genders.gender(query);
	}
}
