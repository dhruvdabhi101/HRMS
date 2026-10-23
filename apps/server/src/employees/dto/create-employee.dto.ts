import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	CreateEmployeeInput,
	EMPLOYEE_COUNTRIES,
	EMPLOYEE_GENDERS,
	EMPLOYEE_LEVELS,
	EMPLOYEE_LIMITS,
	isValidHireDate,
} from "@repo/shared";
import { Transform } from "class-transformer";
import {
	IsIn,
	IsInt,
	IsString,
	Length,
	Max,
	Min,
	ValidateBy,
	ValidateIf,
} from "class-validator";

const trimText = ({ value }: { value: unknown }) =>
	typeof value === "string" ? value.trim() : value;

export class CreateEmployeeDto implements CreateEmployeeInput {
	@ApiProperty({ maxLength: EMPLOYEE_LIMITS.name })
	@Transform(trimText)
	@IsString()
	@Length(1, EMPLOYEE_LIMITS.name)
	name: string;

	@ApiProperty({ enum: EMPLOYEE_COUNTRIES.map((country) => country.code) })
	@IsIn(EMPLOYEE_COUNTRIES.map((country) => country.code))
	countryCode: CreateEmployeeInput["countryCode"];

	@ApiProperty({ maxLength: EMPLOYEE_LIMITS.department })
	@Transform(trimText)
	@IsString()
	@Length(1, EMPLOYEE_LIMITS.department)
	department: string;

	@ApiProperty({ maxLength: EMPLOYEE_LIMITS.jobTitle })
	@Transform(trimText)
	@IsString()
	@Length(1, EMPLOYEE_LIMITS.jobTitle)
	jobTitle: string;

	@ApiProperty({ enum: EMPLOYEE_LEVELS })
	@IsIn(EMPLOYEE_LEVELS)
	level: CreateEmployeeInput["level"];

	@ApiProperty({ enum: EMPLOYEE_GENDERS })
	@IsIn(EMPLOYEE_GENDERS)
	gender: CreateEmployeeInput["gender"];

	@ApiProperty({ format: "date" })
	@ValidateBy({
		name: "hireDate",
		validator: {
			validate: isValidHireDate,
			defaultMessage: () =>
				"Hire date must be a valid YYYY-MM-DD date no later than today (UTC)",
		},
	})
	hireDate: string;

	@ApiProperty({
		minimum: 1,
		maximum: EMPLOYEE_LIMITS.annualBaseMinor,
		description: "Annual base salary in local minor units",
	})
	@IsInt()
	@Min(1)
	@Max(EMPLOYEE_LIMITS.annualBaseMinor)
	annualBaseMinor: number;

	@ApiProperty({
		minimum: 0,
		maximum: EMPLOYEE_LIMITS.bonusTargetBps,
		description: "Bonus target in basis points: 100 = 1%",
	})
	@IsInt()
	@Min(0)
	@Max(EMPLOYEE_LIMITS.bonusTargetBps)
	bonusTargetBps: number;

	@ApiPropertyOptional({
		description: "Derived from country; if supplied, must match",
	})
	@ValidateIf((_object, value) => value !== undefined)
	@IsString()
	currencyCode?: string;
}
