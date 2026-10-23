import {
	ApiPropertyOptional,
	IntersectionType,
	PickType,
} from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { EmployeeDirectoryQueryDto } from "../../employees/dto/employee-directory-query.dto";
import { PayFiltersQueryDto } from "./pay-filters-query.dto";

export class PayDistributionQueryDto extends IntersectionType(
	PayFiltersQueryDto,
	PickType(EmployeeDirectoryQueryDto, ["page", "pageSize"] as const),
) {
	@ApiPropertyOptional({ format: "uuid" })
	@IsOptional()
	@IsUUID()
	employeeId?: string;
}
