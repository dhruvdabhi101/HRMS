import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { EMPLOYEE_COUNTRIES } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeeDetailResponseDto } from "./dto/employee-detail-response.dto";
import { toEmployeeDetail } from "./employees.utils";

@Injectable()
export class EmployeesService {
	constructor(private readonly prisma: PrismaService) {}

	private async getCurrencyCode(input: CreateEmployeeDto) {
		const country = EMPLOYEE_COUNTRIES.find(
			({ code }) => code === input.countryCode,
		);
		if (
			!country ||
			(input.currencyCode !== undefined &&
				input.currencyCode !== country.currency)
		) {
			throw new BadRequestException({
				message: "Check the highlighted fields.",
				fieldErrors: {
					currencyCode: "Currency must match the selected country",
				},
			});
		}
		const currency = await this.prisma.fxRate.findUnique({
			where: { currencyCode: country.currency },
		});
		if (!currency) {
			throw new BadRequestException({
				message: "Check the highlighted fields.",
				fieldErrors: {
					countryCode: "This country's currency is not configured yet.",
				},
			});
		}
		return country.currency;
	}

	async create(input: CreateEmployeeDto): Promise<EmployeeDetailResponseDto> {
		const currencyCode = await this.getCurrencyCode(input);
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
		const employee = await this.prisma.employee.findUnique({
			where: { id },
			include: {
				compensationChanges: {
					orderBy: [{ changedAt: "desc" }, { id: "desc" }],
				},
			},
		});
		if (!employee) throw new NotFoundException("Employee not found");
		return toEmployeeDetail(employee);
	}
}
