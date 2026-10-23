import { ApiProperty, PickType } from "@nestjs/swagger";
import { EmployeeDirectoryResponse, EmployeeFilterOptions } from "@repo/shared";
import { EmployeeDetailResponseDto } from "./employee-detail-response.dto";

class EmployeeListItemDto extends PickType(EmployeeDetailResponseDto, [
	"id",
	"name",
	"countryCode",
	"department",
	"jobTitle",
	"level",
	"status",
	"currencyCode",
	"annualBaseMinor",
	"bonusTargetBps",
] as const) {}

export class EmployeeDirectoryResponseDto implements EmployeeDirectoryResponse {
	@ApiProperty({ type: [EmployeeListItemDto] })
	items: EmployeeListItemDto[];
	@ApiProperty()
	totalCount: number;
	@ApiProperty()
	page: number;
	@ApiProperty()
	pageSize: number;
}

export class EmployeeFilterOptionsDto implements EmployeeFilterOptions {
	@ApiProperty({ type: [String] })
	departments: string[];
	@ApiProperty({ type: [String] })
	jobTitles: string[];
}
