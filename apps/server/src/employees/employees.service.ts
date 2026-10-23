import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeeDetailResponseDto } from "./dto/employee-detail-response.dto";
import { getEmployeeCurrency } from "./employee-currency.utils";
import { findEmployee, toEmployeeDetail } from "./employees.utils";

@Injectable()
export class EmployeesService {
	constructor(private readonly prisma: PrismaService) {}

	async create(input: CreateEmployeeDto): Promise<EmployeeDetailResponseDto> {
		const currencyCode = await getEmployeeCurrency(this.prisma, input);
		const employee = await this.prisma.employee.create({
			data: {
				...input,
				currencyCode,
				hireDate: new Date(`${input.hireDate}T00:00:00.000Z`),
				compensationChanges: {
					create: {
						newBaseMinor: input.annualBaseMinor,
						newBonusBps: input.bonusTargetBps,
						newCurrencyCode: currencyCode,
					},
				},
			},
			include: { compensationChanges: true },
		});
		return toEmployeeDetail(employee);
	}

	async get(id: string): Promise<EmployeeDetailResponseDto> {
		return toEmployeeDetail(await findEmployee(this.prisma, id));
	}
}
