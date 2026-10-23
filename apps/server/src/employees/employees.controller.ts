import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeeDetailResponseDto } from "./dto/employee-detail-response.dto";
import { EmployeeDirectoryQueryDto } from "./dto/employee-directory-query.dto";
import {
	EmployeeDirectoryResponseDto,
	EmployeeFilterOptionsDto,
} from "./dto/employee-directory-response.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeDirectoryService } from "./employee-directory.service";
import { EmployeeUpdatesService } from "./employee-updates.service";
import { EmployeesService } from "./employees.service";

@ApiTags("Employees")
@Controller("employees")
export class EmployeesController {
	constructor(
		private readonly employees: EmployeesService,
		private readonly directory: EmployeeDirectoryService,
		private readonly updates: EmployeeUpdatesService,
	) {}

	@Get()
	@ApiResponse({ status: 200, type: EmployeeDirectoryResponseDto })
	@ApiResponse({ status: 400, description: "Invalid directory query" })
	list(
		@Query() query: EmployeeDirectoryQueryDto,
	): Promise<EmployeeDirectoryResponseDto> {
		return this.directory.list(query);
	}

	@Get("filter-options")
	@ApiResponse({ status: 200, type: EmployeeFilterOptionsDto })
	filterOptions(): Promise<EmployeeFilterOptionsDto> {
		return this.directory.filterOptions();
	}

	@Post()
	@ApiResponse({ status: 201, type: EmployeeDetailResponseDto })
	@ApiResponse({ status: 400, description: "Invalid employee fields" })
	create(@Body() input: CreateEmployeeDto): Promise<EmployeeDetailResponseDto> {
		return this.employees.create(input);
	}

	@Patch(":id")
	@ApiResponse({ status: 200, type: EmployeeDetailResponseDto })
	@ApiResponse({ status: 400, description: "Invalid fields or no changes" })
	@ApiResponse({ status: 404, description: "Employee not found" })
	@ApiResponse({
		status: 409,
		description: "Terminated employees cannot be edited",
	})
	update(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() input: UpdateEmployeeDto,
	): Promise<EmployeeDetailResponseDto> {
		return this.updates.update(id, input);
	}

	@Delete(":id")
	@ApiResponse({ status: 200, type: EmployeeDetailResponseDto })
	@ApiResponse({ status: 404, description: "Employee not found" })
	terminate(
		@Param("id", ParseUUIDPipe) id: string,
	): Promise<EmployeeDetailResponseDto> {
		return this.updates.terminate(id);
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
