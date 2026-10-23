import { ApiProperty, OmitType } from "@nestjs/swagger";
import { EmployeeDetail } from "@repo/shared";
import { CompensationChangeResponseDto } from "./compensation-change-response.dto";
import { CreateEmployeeDto } from "./create-employee.dto";

export class EmployeeDetailResponseDto
	extends OmitType(CreateEmployeeDto, ["currencyCode"] as const)
	implements EmployeeDetail
{
	@ApiProperty({ format: "uuid" })
	id: string;
	@ApiProperty({ enum: ["active", "terminated"] })
	status: "active" | "terminated";
	@ApiProperty()
	currencyCode: string;
	@ApiProperty()
	bonusMinor: number;
	@ApiProperty()
	targetMinor: number;
	@ApiProperty({ format: "date-time" })
	createdAt: string;
	@ApiProperty({ format: "date-time" })
	updatedAt: string;
	@ApiProperty({ type: [CompensationChangeResponseDto] })
	compensationChanges: CompensationChangeResponseDto[];
}
