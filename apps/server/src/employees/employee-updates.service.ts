import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { getEmployeeCurrency } from "./employee-currency.utils";
import {
	compensationUpdate,
	employeeUpdateData,
} from "./employee-update.utils";
import {
	employeeDetailInclude,
	findEmployee,
	toEmployeeDetail,
} from "./employees.utils";

@Injectable()
export class EmployeeUpdatesService {
	constructor(private readonly prisma: PrismaService) {}

	async update(id: string, input: UpdateEmployeeDto) {
		return this.prisma.$transaction(async (transaction) => {
			const employee = await findEmployee(transaction, id);
			if (employee.status === "terminated")
				throw new ConflictException("Terminated employees cannot be edited");
			const currencyCode = await getEmployeeCurrency(transaction, {
				countryCode: input.countryCode ?? employee.countryCode,
				currencyCode: input.currencyCode,
			});
			const updated = await transaction.employee.update({
				where: { id },
				data: {
					...employeeUpdateData(employee, input, currencyCode),
					compensationChanges: compensationUpdate(
						employee,
						input,
						currencyCode,
					),
				},
				include: employeeDetailInclude,
			});
			return toEmployeeDetail(updated);
		});
	}

	async terminate(id: string) {
		return this.prisma.$transaction(async (transaction) => {
			const employee = await findEmployee(transaction, id);
			if (employee.status === "terminated") return toEmployeeDetail(employee);
			return toEmployeeDetail(
				await transaction.employee.update({
					where: { id },
					data: { status: "terminated" },
					include: employeeDetailInclude,
				}),
			);
		});
	}
}
