import { ApiProperty } from "@nestjs/swagger";
import type {
	EmployeePayPosition,
	GenderPayGroup,
	GenderPayResponse,
	PayDistributionResponse,
	PayDistributionSummary,
	PayOutlier,
} from "@repo/shared";
import { PayFxRateDto } from "./pay-groups-response.dto";

class DistributionSummaryDto implements PayDistributionSummary {
	@ApiProperty() headcount: number;
	@ApiProperty() min: number;
	@ApiProperty({
		description:
			"Statistics in USD cents; interpolated values retain fractional cents until display",
	})
	q1: number;
	@ApiProperty() median: number;
	@ApiProperty() average: number;
	@ApiProperty() q3: number;
	@ApiProperty() max: number;
	@ApiProperty() lowerWhisker: number;
	@ApiProperty() upperWhisker: number;
	@ApiProperty() lowerFence: number;
	@ApiProperty() upperFence: number;
	@ApiProperty() outlierCount: number;
	@ApiProperty() smallSample: boolean;
}
class PayOutlierDto implements PayOutlier {
	@ApiProperty() id: string;
	@ApiProperty() name: string;
	@ApiProperty() annualBaseUsd: number;
}
class EmployeePayPositionDto
	extends PayOutlierDto
	implements EmployeePayPosition
{
	@ApiProperty({ enum: ["active", "terminated"] }) status:
		| "active"
		| "terminated";
	@ApiProperty() includedInCohort: boolean;
	@ApiProperty({ type: Boolean, nullable: true }) isOutlier: boolean | null;
}
class PayOutliersPageDto {
	@ApiProperty({ type: [PayOutlierDto] }) items: PayOutlierDto[];
	@ApiProperty() totalCount: number;
	@ApiProperty() page: number;
	@ApiProperty() pageSize: number;
}
export class PayDistributionResponseDto implements PayDistributionResponse {
	@ApiProperty({ enum: ["USD"] }) currencyCode: "USD";
	@ApiProperty({ type: [PayFxRateDto] }) fxRates: PayFxRateDto[];
	@ApiProperty({ type: DistributionSummaryDto, nullable: true })
	summary: DistributionSummaryDto | null;
	@ApiProperty({ type: EmployeePayPositionDto, nullable: true })
	employee: EmployeePayPositionDto | null;
	@ApiProperty({ type: PayOutliersPageDto }) outliers: PayOutliersPageDto;
}
class GenderMedianDto {
	@ApiProperty({ enum: ["woman", "man", "non_binary", "undisclosed"] })
	gender: GenderPayGroup["genders"][number]["gender"];
	@ApiProperty() headcount: number;
	@ApiProperty() median: number;
}
class GenderPayGroupDto implements GenderPayGroup {
	@ApiProperty() level: GenderPayGroup["level"];
	@ApiProperty({ type: [GenderMedianDto] }) genders: GenderMedianDto[];
	@ApiProperty({ type: Number, nullable: true }) gapPercent: number | null;
	@ApiProperty() smallSample: boolean;
}
export class GenderPayResponseDto implements GenderPayResponse {
	@ApiProperty({ enum: ["USD"] }) currencyCode: "USD";
	@ApiProperty({ type: [PayFxRateDto] }) fxRates: PayFxRateDto[];
	@ApiProperty({ type: [GenderPayGroupDto] }) groups: GenderPayGroupDto[];
}
