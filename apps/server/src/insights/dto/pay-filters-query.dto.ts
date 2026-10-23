import { PickType } from "@nestjs/swagger";
import { EmployeeDirectoryQueryDto } from "../../employees/dto/employee-directory-query.dto";

export class PayFiltersQueryDto extends PickType(EmployeeDirectoryQueryDto, [
	"countryCode",
	"department",
	"jobTitle",
	"level",
] as const) {}
