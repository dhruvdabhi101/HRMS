import { ApiPropertyOptional } from "@nestjs/swagger";
import { PAY_DIMENSIONS, PAY_METRICS, PayGroupsQuery } from "@repo/shared";
import { Transform } from "class-transformer";
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayUnique,
	IsArray,
	IsIn,
} from "class-validator";
import { PayFiltersQueryDto } from "./pay-filters-query.dto";

export class PayGroupsQueryDto
	extends PayFiltersQueryDto
	implements PayGroupsQuery
{
	@ApiPropertyOptional({
		type: String,
		description: "One or two distinct comma-separated dimensions",
		default: "country",
	})
	@Transform(({ value }) =>
		typeof value === "string" ? value.split(",") : null,
	)
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(2)
	@ArrayUnique()
	@IsIn(PAY_DIMENSIONS, { each: true })
	dimensions: PayGroupsQuery["dimensions"] = ["country"];

	@ApiPropertyOptional({ enum: PAY_METRICS, default: "median" })
	@IsIn(PAY_METRICS)
	metric: PayGroupsQuery["metric"] = "median";
}
