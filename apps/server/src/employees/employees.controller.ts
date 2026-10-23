import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeeDetailResponseDto } from "./dto/employee-detail-response.dto";
import { EmployeesService } from "./employees.service";

@ApiTags("Employees")
@Controller("employees")
export class EmployeesController {
	constructor(private readonly employees: EmployeesService) {}

	@Post()
	@ApiResponse({ status: 201, type: EmployeeDetailResponseDto })
	@ApiResponse({ status: 400, description: "Invalid employee fields" })
	create(@Body() input: CreateEmployeeDto): Promise<EmployeeDetailResponseDto> {
		return this.employees.create(input);
	}

	@Get(":id")
	@ApiResponse({ status: 200, type: EmployeeDetailResponseDto })
	@ApiResponse({ status: 404, description: "Employee not found" })
	get(
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<EmployeeDetailResponseDto> {
		return this.employees.get(id);
	}
}
