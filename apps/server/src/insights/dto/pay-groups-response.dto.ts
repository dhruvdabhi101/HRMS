import { ApiProperty } from "@nestjs/swagger";
import {
	PAY_DIMENSIONS,
	PAY_METRICS,
	PayDimension,
	PayFxRate,
	PayGroup,
	PayGroupsResponse,
	type PayMetric,
} from "@repo/shared";

class PayGroupDto implements PayGroup {
	@ApiProperty({ type: "object", additionalProperties: { type: "string" } })
	dimensions: PayGroup["dimensions"];
	@ApiProperty() headcount: number;
	@ApiProperty({
		description:
			"Employee count for headcount; integer USD cents for monetary metrics",
	})
	value: number;
}
export class PayFxRateDto implements PayFxRate {
	@ApiProperty() currencyCode: string;
	@ApiProperty() usdRateMicros: number;
	@ApiProperty({ example: "2026-01-01" }) asOfDate: string;
}
export class PayGroupsResponseDto implements PayGroupsResponse {
	@ApiProperty({ enum: PAY_DIMENSIONS, isArray: true })
	dimensions: PayDimension[];
	@ApiProperty({ enum: PAY_METRICS }) metric: PayMetric;
	@ApiProperty({ enum: ["USD"] }) currencyCode: "USD";
	@ApiProperty({ type: [PayFxRateDto] }) fxRates: PayFxRateDto[];
	@ApiProperty({ type: [PayGroupDto] }) groups: PayGroupDto[];
}
