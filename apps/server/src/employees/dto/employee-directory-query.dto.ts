import { ApiPropertyOptional } from "@nestjs/swagger";
import {
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_LEVELS,
	EMPLOYEE_SORT_FIELDS,
	EmployeeDirectoryQuery,
} from "@repo/shared";
import { Transform } from "class-transformer";
import {
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from "class-validator";

const queryInteger = ({ value }: { value: unknown }) =>
	typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
const trimText = ({ value }: { value: unknown }) =>
	typeof value === "string" ? value.trim() : value;

export class EmployeeDirectoryQueryDto implements EmployeeDirectoryQuery {
	@ApiPropertyOptional({ default: 1, minimum: 1 })
	@Transform(queryInteger)
	@IsInt()
	@Min(1)
	@Max(Math.floor(Number.MAX_SAFE_INTEGER / 100))
	page = 1;

	@ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
	@Transform(queryInteger)
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize = 25;

	@ApiPropertyOptional({ maxLength: 120 })
	@IsOptional()
	@Transform(trimText)
	@IsString()
	@MaxLength(120)
	search?: string;

	@ApiPropertyOptional({ enum: EMPLOYEE_COUNTRIES.map(({ code }) => code) })
	@IsOptional()
	@IsIn(EMPLOYEE_COUNTRIES.map(({ code }) => code))
	countryCode?: EmployeeDirectoryQuery["countryCode"];

	@ApiPropertyOptional({ maxLength: 100 })
	@IsOptional()
	@Transform(trimText)
	@IsString()
	@MaxLength(100)
	department?: string;

	@ApiPropertyOptional({ maxLength: 100 })
	@IsOptional()
	@Transform(trimText)
	@IsString()
	@MaxLength(100)
	jobTitle?: string;

	@ApiPropertyOptional({ enum: EMPLOYEE_LEVELS })
	@IsOptional()
	@IsIn(EMPLOYEE_LEVELS)
	level?: EmployeeDirectoryQuery["level"];

	@ApiPropertyOptional({
		enum: ["active", "terminated", "all"],
		default: "active",
	})
	@IsIn(["active", "terminated", "all"])
	status: NonNullable<EmployeeDirectoryQuery["status"]> = "active";

	@ApiPropertyOptional({ enum: EMPLOYEE_SORT_FIELDS, default: "name" })
	@IsIn(EMPLOYEE_SORT_FIELDS)
	sortBy: NonNullable<EmployeeDirectoryQuery["sortBy"]> = "name";

	@ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
	@IsIn(["asc", "desc"])
	sortDirection: "asc" | "desc" = "asc";
}
